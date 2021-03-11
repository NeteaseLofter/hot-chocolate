export function getUniqueId () {
  return Math.floor(Math.random() * 1E9);
}

export const uniqueId = getUniqueId();
