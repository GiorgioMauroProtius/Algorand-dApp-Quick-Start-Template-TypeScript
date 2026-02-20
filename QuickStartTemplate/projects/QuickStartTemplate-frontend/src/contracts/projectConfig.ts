// Project-specific staking app IDs
export interface ProjectStakingConfig {
  projectId: number;
  projectName: string;
  stakingAppId: number | null;
}

// Get app ID for Project 1 from environment
const project1AppId = import.meta.env.VITE_PROTIUS_STAKING_APP_ID;
if (!project1AppId) {
  throw new Error("VITE_PROTIUS_STAKING_APP_ID is missing from environment. Please set it in .env.local or .env.");
}
const parsedProject1AppId = Number(project1AppId);
if (!parsedProject1AppId || isNaN(parsedProject1AppId) || parsedProject1AppId <= 0) {
  throw new Error("VITE_PROTIUS_STAKING_APP_ID is invalid. Must be a positive integer.");
}

export const PROJECT_STAKING_CONFIGS: ProjectStakingConfig[] = [
  {
    projectId: 1,
    projectName: "Project 1",
    stakingAppId: parsedProject1AppId && !isNaN(parsedProject1AppId) && parsedProject1AppId > 0 
      ? parsedProject1AppId 
      : null,
  },
  {
    projectId: 2,
    projectName: "Project 2",
    stakingAppId: null,
  },
  {
    projectId: 3,
    projectName: "Project 3",
    stakingAppId: null,
  },
];

export function getProjectStakingConfig(projectId: number): ProjectStakingConfig | undefined {
  return PROJECT_STAKING_CONFIGS.find(p => p.projectId === projectId);
}

export function hasStakingDeployed(projectId: number): boolean {
  const config = getProjectStakingConfig(projectId);
  return config?.stakingAppId !== null && config?.stakingAppId !== undefined && config.stakingAppId > 0;
}
