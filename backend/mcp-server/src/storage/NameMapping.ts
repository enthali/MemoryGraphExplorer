/**
 * NameMapping handles bidirectional mapping between names and IDs
 */
export class NameMapping {
  private nameToId: Map<string, string> = new Map();
  private idToName: Map<string, string> = new Map();

  /**
   * Get ID for a name
   */
  getId(name: string): string | undefined {
    return this.nameToId.get(name);
  }

  /**
   * Get name for an ID
   */
  getName(id: string): string | undefined {
    return this.idToName.get(id);
  }

  /**
   * Add a new name-ID mapping
   */
  addMapping(name: string, id: string): void {
    // Remove any existing mappings for this name or ID first
    this.removeByName(name);
    this.removeById(id);
    
    this.nameToId.set(name, id);
    this.idToName.set(id, name);
  }

  /**
   * Remove mapping by name
   */
  removeMapping(name: string): void {
    this.removeByName(name);
  }

  /**
   * Remove mapping by name (internal helper)
   */
  private removeByName(name: string): void {
    const id = this.nameToId.get(name);
    if (id) {
      this.nameToId.delete(name);
      this.idToName.delete(id);
    }
  }

  /**
   * Remove mapping by ID (internal helper)
   */
  private removeById(id: string): void {
    const name = this.idToName.get(id);
    if (name) {
      this.nameToId.delete(name);
      this.idToName.delete(id);
    }
  }

  /**
   * Update name for existing mapping (used for entity renaming)
   */
  updateName(oldName: string, newName: string): void {
    const id = this.nameToId.get(oldName);
    if (!id) {
      throw new Error(`No mapping found for name: ${oldName}`);
    }

    // Check if new name already exists
    if (this.nameToId.has(newName)) {
      throw new Error(`Name already exists: ${newName}`);
    }

    // Update the mappings
    this.nameToId.delete(oldName);
    this.nameToId.set(newName, id);
    this.idToName.set(id, newName);
  }

  /**
   * Get all name-ID pairs (for debugging/testing)
   */
  getAllMappings(): Array<{ name: string; id: string }> {
    return Array.from(this.nameToId.entries()).map(([name, id]) => ({ name, id }));
  }

  /**
   * Clear all mappings
   */
  clear(): void {
    this.nameToId.clear();
    this.idToName.clear();
  }
}