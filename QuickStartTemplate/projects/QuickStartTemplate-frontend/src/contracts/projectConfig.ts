// Project-specific staking app IDs
export interface ProjectStakingConfig {
  projectId: number;
  projectName: string;
  stakingAppId: number | null;
}

// Get app ID for Project 1 from environment
const project1AppId = import.meta.env.VITE_PROTIUS_STAKING_APP_ID;
const parsedProject1AppId = project1AppId ? Number(project1AppId) : null;

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
