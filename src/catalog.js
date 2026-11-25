// Public GitHub snapshot. Refresh with: node scripts/refresh-catalog.mjs
// Editorial summaries describe projects, not independently reproduced results.
export const catalogDate = '2026-11-25';
const snapshot = [
  ['1463081989','xt67','3D-Building-Reconstruction','Reconstructs camera poses, point clouds and observed surfaces from overlapping building images. Synthetic pipeline checks; unseen surfaces remain missing.','Python'],
  ['1199263986','xt67','AURORA','Research prototype studying synthetic chest X-ray augmentation with limited TB-labelled data. Experimental findings, not clinical validation.','Python'],
  ['1426544923','xt67','AutoCar-Sim','CARLA driving simulation with behavioural cloning, steering prediction and a dashboard for model training and evaluation.','Python'],
  ['1139179947','xt67','CASS','A local AI assistant that translates natural-language questions into restricted, read-only PostgreSQL queries.','Python'],
  ['1357246457','xt67','github-readme-stats','Archived fork of the GitHub profile statistics project. Upstream authorship and licensing remain with its contributors.',null,'https://github-readme-stats.vercel.app',true,true],
  ['1462712434','xt67','Heartbeat-Classifier','An experimental ECG heartbeat classifier using a 1D CNN and the MIT-BIH dataset, with attention to class imbalance.','Python','https://heartbeat-classifier-web.vercel.app'],
  ['1463080309','xt67','Mars-Rover-Terrain-Segmentation','A terrain-segmentation pipeline for rover images, labelling soil, bedrock, sand and large rocks with DeepLabV3+.','Python'],
  ['1463081275','xt67','ML-Based-Vision','Turns relative monocular depth into coloured point clouds. Scale is relative, and individual frames are not fused into a map.','Python'],
  ['1198588870','xt67','ML-Paper-Reproducibility-Predictor','Examines research methods text for reporting gaps and offers reproducibility indicators and suggested improvements.','Python'],
  ['1462712795','xt67','NeuroSnake','A Snake-playing reinforcement-learning project using Double DQN, PyTorch and a NumPy network with manual backpropagation.','Python','https://neurosnake-web.vercel.app'],
  ['1199276513','xt67','Pune-AQI-Monitor','Pune environmental-data monitoring and visualisation. Live regional model estimates are distinguished from station measurements.','Python'],
  ['1011826287','xt67','Qatar-Water-Intelligence','Explores Qatar water-reservoir capacity data using Python, SQL, PostgreSQL and interactive visualisations.','Python','https://qatar-water-intelligence-web.vercel.app'],
  ['1354851387','xt67','Robotic-Arm','A hand-tracking robotic-arm project combining computer vision, MediaPipe and Arduino servo control. See the repository for implementation and attribution.','Python'],
  ['1208460365','xt67','SlimZero','Local prompt compression and LLM workflow tooling, with response controls and circuit breakers for agent execution.','Python'],
  ['1357213690','xt67','xt67','The GitHub profile README repository for Rayan Rahman / xt67.',null],
  ['1113214368','xt67-Lab','buymeachai','An open-source UPI support-page project for Indian creators. Listed here as a software project; this portfolio does not collect donations.','HTML','https://xt67-lab.github.io/buymeachai/'],
  ['1110100149','xt67-Lab','shlama-linux','An Ollama-powered terminal assistant that translates natural language into Linux command suggestions.','Shell'],
  ['1111788731','xt67-Lab','shlama-windows','An Ollama-powered terminal assistant that translates natural language into PowerShell command suggestions.','PowerShell']
];
export const repositories = snapshot.map(([id,owner,name,description,language,homepage=null,fork=false,archived=false]) => ({
  id, fullName: `${owner}/${name}`, name, owner, url: `https://github.com/${owner}/${name}`,
  description, language, fork, archived, homepage, kind: name === 'xt67' && owner === 'xt67' ? 'profile' : fork ? 'fork' : 'project'
}));
export const organizations = [
  {id:'lab',owner:'xt67-Lab',name:'xt67-Lab',url:'https://github.com/xt67-Lab',theme:'research',description:'A scientific research lab district in this portfolio, representing the xt67-Lab GitHub organization.',repositoryCount:3,status:'public-projects'},
  {id:'ccp',owner:'Cat-Communist-Party-CCP',name:'Cat Communist Party · CCP',url:'https://github.com/Cat-Communist-Party-CCP',theme:'crew',description:'A fictional, mafia-film-inspired cat-crew hideout representing this GitHub organization. The game theme is not a claim about real-world activity.',repositoryCount:0,status:'no-public-repositories'}
];
