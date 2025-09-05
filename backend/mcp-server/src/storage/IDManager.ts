/**
 * IDManager handles sequential ID generation for all entities, relations, and type definitions
 */
export class IDManager {
  private currentId: number = 0;

  /**
   * Generate a new sequential ID
   */
  createNewId(): string {
    this.currentId++;
    return this.currentId.toString();
  }

  /**
   * Get the current highest ID
   */
  getHighestId(): string {
    return this.currentId.toString();
  }

  /**
   * Set the current ID counter (used during initialization)
   */
  setCurrentId(id: number): void {
    this.currentId = id;
  }

  /**
   * Initialize ID counter by finding the highest existing ID
   */
  initializeFromIds(ids: string[]): void {
    const numericIds = ids
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));
    
    this.currentId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  }
}