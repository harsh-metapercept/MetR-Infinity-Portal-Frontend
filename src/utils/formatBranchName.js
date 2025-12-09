// Extract name before first underscore from branch name
// Example: "Power_output_1" -> "Power"
export const formatBranchName = (branchName) => {
  if (!branchName) return '';
  const parts = branchName.split('_');
  return parts[0];
};
