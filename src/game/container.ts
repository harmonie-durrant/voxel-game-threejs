import { blocks } from "./blocks";

export type ItemData = {
    blockId: number;
    texture: string;
    type: string; // 'placeable' or 'tool' or 'item'
    amount: number;
};

export const emptyItem: ItemData = {
    blockId: -1,
    texture: '',
    type: '',
    amount: 0
};

export class Container {
    maxItems: number;
    items: ItemData[];

    grabbedItem: ItemData = emptyItem;

    stackSize: number = 64;

    constructor(maxItems: number) {
        this.maxItems = maxItems;
        this.items = [
            ...Array(maxItems).fill(emptyItem)
        ];
    }

    getFirstOfSameDataOrEmpty(item: ItemData): number {
        for (let i = 0; i < this.maxItems; i++) {
            if (this.items[i].blockId === item.blockId && this.items[i].amount < this.stackSize) {
                return i;
            }
        }
        for (let i = 0; i < this.maxItems; i++) {
            if (this.items[i].blockId === -1 || this.items[i].amount === 0 || this.items[i].blockId === blocks.empty.id) {
                return i;
            }
        }
        return -1;
    }

    getItemAt(index: number): ItemData {
        if (index < 0 || index >= this.maxItems) {
            return emptyItem;
        }
        return this.items[index];
    }

    loadItemsFromSave(items: ItemData[]): void {
        this.items = Array(this.maxItems).fill(emptyItem);
        if (!items || items.length === 0) {
            return;
        }
        this.items = items;
        // Fill remaining slots with empty items
        for (let i = items.length; i < this.maxItems; i++) {
            this.items[i] = emptyItem;
        }
        this.grabbedItem = emptyItem;
    }

    hasItem(blockId: number, amount: number): boolean {
        let totalAmount = 0;
        for (const item of this.items) {
            if (item.blockId === blockId) {
                totalAmount += item.amount;
            }
        }
        return totalAmount >= amount;
    }

    addItem(item: ItemData, index: number = -1): boolean {
        console.log(`Adding item: ${item.blockId} x${item.amount} at index ${index}`);
        if (index === -1) {
            index = this.getFirstOfSameDataOrEmpty(item);
            if (index === -1) {
                return false; // No empty slot available
            }
        }
        if (index < 0 || index >= this.maxItems)
            return false;
        if (this.items[index].blockId !== -1) {
            if (
                this.items[index].blockId !== item.blockId ||
                this.items[index].amount + item.amount > this.stackSize
            ) {
                return false;
            }
            this.items[index].amount += item.amount;
            return true;
        }
        this.items[index] = item;
        return true;
    }

    removeItem(index: number, amount: number = -1): ItemData {
        if (index < 0 || index >= this.maxItems) {
            return emptyItem;
        }
        const removedItem = this.items[index];
        if (amount === -1 || amount >= removedItem.amount) {
            this.items[index] = emptyItem;
        } else {
            this.items[index].amount -= amount;
        }
        return removedItem;
    }
}