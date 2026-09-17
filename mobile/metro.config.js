const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo workspaceRoot (to access shared domain logic)
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to resolve dependencies from specified paths
config.resolver.disableHierarchicalLookup = true;

// 4. Configure alias mapping for @ and @shared-domain to resolve root src
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@": path.resolve(workspaceRoot, "src"),
  "@shared-domain": path.resolve(workspaceRoot, "src/features/workout/domain"),
};

module.exports = config;
