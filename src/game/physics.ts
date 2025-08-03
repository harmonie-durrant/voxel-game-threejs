import * as THREE from 'three';
import { Player } from './player';
import { blocks } from './blocks';
import type { World } from './world';

const collisionMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.2
});
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);

const contactMaterial = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x00ff00
});
const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6);

export class Physics {
  simulationRate: number = 250;
  timeStep: number = 1 / this.simulationRate;
  accumulator: number = 0;
  gravity: number = 32;

  // Item entity physics defaults
  itemGravity: number = 9.8;
  itemFriction: number = 0.7;

  helpers: THREE.Group;
  
  constructor(scene: THREE.Scene) {
    this.helpers = new THREE.Group();
    this.helpers.visible = false;
    scene.add(this.helpers);
  }

  update (dt : number, player : Player, world : World) {
    if (world.loading) return;
    this.accumulator += dt;
    while (this.accumulator >= this.timeStep) {
      this.helpers.clear();
      player.velocity.y -= this.gravity * this.timeStep;
      player.applyInputs(this.timeStep);
      player.updateBoundsHelper();
      this.detectCollisions(player, world);
      
      // --- Item entity physics and merging ---
      // Gather all item entities
      const itemEntities = world.children.filter(
        (c) => c.userData && c.userData.isItemEntity
      );

      // Physics and collision
      for (const child of itemEntities) {
        if (!child.userData.gravity) {
          child.userData.gravity = new THREE.Vector3(0, -this.itemGravity, 0);
        } else {
          child.userData.gravity.set(0, -this.itemGravity, 0);
        }

        // Apply gravity
        if (!child.userData.velocity) child.userData.velocity = new THREE.Vector3();
        child.userData.velocity.addScaledVector(child.userData.gravity, this.timeStep);
        child.position.addScaledVector(child.userData.velocity, this.timeStep);

        // Decrement pickup delay if present
        if (typeof child.userData.pickupDelay === 'number' && child.userData.pickupDelay > 0) {
          child.userData.pickupDelay -= this.timeStep;
          if (child.userData.pickupDelay < 0) child.userData.pickupDelay = 0;
        }

        // Terrain collision: find the block directly below the item
        const below = new THREE.Vector3(
          Math.round(child.position.x),
          Math.floor(child.position.y + 0.4),
          Math.round(child.position.z)
        );
        const blockBelow = world.getBlock(below.x, below.y, below.z);
        if (blockBelow && blockBelow.id !== blocks.empty.id) {
          // Place item on top of the block
          child.position.y = below.y + 0.6;
          child.userData.velocity.y = 0;
          // Friction
          child.userData.velocity.x *= this.itemFriction;
          child.userData.velocity.z *= this.itemFriction;
        }
      }

      // --- Player pickup logic ---
      const pickupDistance = 2; // slightly larger than merge distance
      for (const item of itemEntities) {
        if (item.position.distanceTo(player.position) < pickupDistance && item.userData.pickupDelay == 0) {
          const pickedUp = player.inventory.addItem(item.userData.item);
          if (pickedUp) {
            world.remove(item as THREE.Object3D);
            player.updateHotbarDisplay();
          }
        }
      }

      // --- Merging logic ---
      const mergeDistance = 0.3; // merge if centers are within this distance
      const toRemove = new Set();
      for (let i = 0; i < itemEntities.length; i++) {
        const a = itemEntities[i];
        if (toRemove.has(a)) continue;
        for (let j = i + 1; j < itemEntities.length; j++) {
          const b = itemEntities[j];
          if (toRemove.has(b)) continue;
          // Only merge if same item type (optional: check a.userData.item)
          if (a.userData.item && b.userData.item && a.userData.item.blockId === b.userData.item.blockId) {
            if (a.position.distanceTo(b.position) < mergeDistance) {
              // Merge: increment a's amount, remove b
              a.userData.item.amount = (a.userData.item.amount || 1) + (b.userData.item.amount || 1);
              toRemove.add(b);
            }
          }
        }
      }
      // Remove merged entities from world
      for (const ent of toRemove) {
        world.remove(ent as THREE.Object3D);
      }

      this.accumulator -= this.timeStep;
    }
  }

  broadPhase(player : Player, world : World) {
    const candidates : any[] = [];

    const extents = {
      x: {
        min: Math.floor(player.position.x - player.radius),
        max: Math.ceil(player.position.x + player.radius)
      },
      y: {
        min: Math.floor(player.position.y - player.height),
        max: Math.ceil(player.position.y)
      },
      z: {
        min: Math.floor(player.position.z - player.radius),
        max: Math.ceil(player.position.z + player.radius)
      }
    }

    for (let x = extents.x.min; x <= extents.x.max; x++) {
      for (let y = extents.y.min; y <= extents.y.max; y++) {
        for (let z = extents.z.min; z <= extents.z.max; z++) {
          const block = world.getBlock(x, y, z);
          if (block && block.id !== blocks.empty.id) {
            const blockPos : THREE.Vector3 = new THREE.Vector3(x, y, z);
            candidates.push(blockPos);
            this.addCollisionHelper(blockPos);
          }
        }
      }
    }

    return candidates;
  }

  narrowPhase(candidates : any[], player : Player) {
    const collisions : any[] = [];

    for (const block of candidates) {
      const p = player.position;
      const closestPoint = new THREE.Vector3(
        Math.max(block.x - 0.5, Math.min(p.x, block.x + 0.5)),
        Math.max(block.y - 0.5, Math.min(p.y - (player.height / 2), block.y + 0.5)),
        Math.max(block.z - 0.5, Math.min(p.z, block.z + 0.5))
      );

      const dx = closestPoint.x - player.position.x;
      const dy = closestPoint.y - (player.position.y - (player.height / 2));
      const dz = closestPoint.z - player.position.z;

      if (this.pointInBoundingCylinder(closestPoint, player)) {
        const overlapY = (player.height / 2) - Math.abs(dy);
        const overlapXZ = player.radius - Math.sqrt((dx ** 2) + (dz ** 2));

        let normal, overlap;
        if (overlapY < overlapXZ) {
          normal = new THREE.Vector3(0, -Math.sign(dy), 0);
          overlap = overlapY;
          player.onGround = true;
        } else {
          normal = new THREE.Vector3(-dx, 0, -dz).normalize();
          overlap = overlapXZ;
        }

        collisions.push({
          block,
          contactPoint: closestPoint,
          normal,
          overlap
        });
        this.addContactHelper(closestPoint);
      }
    }

    return collisions;
  }

  resolveCollisions(collisions : any[], player : Player) {
    collisions.sort((a, b) => {
        return a.overlap < b.overlap ? -1 : 1;
    });

    for (const collision of collisions) {
      if (!this.pointInBoundingCylinder(collision.contactPoint, player)) continue;

      let deltaPosition = collision.normal.clone();
      deltaPosition.multiplyScalar(collision.overlap);
      player.position.add(deltaPosition);

      let magnitude = player.velocity.dot(collision.normal);
      let velocityAdjustment = collision.normal.clone();
      velocityAdjustment.multiplyScalar(magnitude);

      player.applyWorldDeltaVelocity(velocityAdjustment.negate());
    }
  }

  detectCollisions(player : Player, world : World) {
    player.onGround = false;
    const candidates = this.broadPhase(player, world);
    const collisions = this.narrowPhase(candidates, player);

    if (collisions.length > 0) {
      this.resolveCollisions(collisions, player);
    }
  }

  addCollisionHelper(block : THREE.Vector3) {
    const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    blockMesh.position.copy(block);
    this.helpers.add(blockMesh);
  }

  addContactHelper(point : THREE.Vector3) {
    const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial);
    contactMesh.position.copy(point);
    this.helpers.add(contactMesh);
  }

  pointInBoundingCylinder(point : THREE.Vector3, player : Player) {
    const dx = point.x - player.position.x;
    const dy = point.y - (player.position.y - (player.height / 2));
    const dz = point.z - player.position.z;
    const r_sq = (dx ** 2) + (dz ** 2);

    return (Math.abs(dy) < player.height / 2) && r_sq < (player.radius ** 2);
  }

}