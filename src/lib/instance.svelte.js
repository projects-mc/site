import { instances } from '#lib/placeholder/instances';

// The instance picked in the sidebar, shared by every page that shows instance data
export const selection = $state({ index: 0 });

export const currentInstance = () => instances[selection.index];
