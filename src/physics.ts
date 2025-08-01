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
  simulationRate: number = 200;
  timeStep: number = 1 / this.simulationRate;
  accumulator: number = 0;
  gravity: number = 32;

  helpers: THREE.Group;
  
  constructor(scene: THREE.Scene) {
    this.helpers = new THREE.Group();
    this.helpers.visible = false;
    scene.add(this.helpers);
  }

  update (dt : number, player : Player, world : World) {
    this.accumulator += dt;
    while (this.accumulator >= this.timeStep) {
      this.helpers.clear();
      player.velocity.y -= this.gravity * this.timeStep;
      player.applyInputs(this.timeStep);
      player.updateBoundsHelper();
      this.detectCollisions(player, world);
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