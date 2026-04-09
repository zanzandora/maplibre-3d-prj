// Helper to filter out internal or handled properties and null/undefined/empty values
export const getDisplayAttributes = (element) => {
  const skip = ["psets"];
  return Object.entries(element).filter(
    ([key, val]) =>
      !skip.includes(key) &&
      !key.startsWith("_") &&
      typeof val !== "object" &&
      val !== null &&
      val !== undefined &&
      val !== "",
  );
};
