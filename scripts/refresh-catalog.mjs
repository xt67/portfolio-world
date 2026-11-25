import {writeFile, rename, unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Public GitHub endpoints only. No token is read, so private repositories cannot
// accidentally enter the client bundle. Refresh deliberately happens at build
// maintenance time, not every visitor's page load.
const owners = ['xt67', 'xt67-Lab', 'Cat-Communist-Party-CCP'];
const target = fileURLToPath(new URL('../src/catalog.js', import.meta.url));
const temporary = `${target}.tmp`;
const summaries = {
  'xt67/3D-Building-Reconstruction': 'Reconstructs camera poses, point clouds and observed surfaces from overlapping building images. Synthetic pipeline checks; unseen surfaces remain missing.',
  'xt67/AURORA': 'Research prototype studying synthetic chest X-ray augmentation with limited TB-labelled data. Experimental findings, not clinical validation.',
  'xt67/AutoCar-Sim': 'CARLA driving simulation with behavioural cloning, steering prediction and a dashboard for model training and evaluation.',
  'xt67/CASS': 'A local AI assistant that translates natural-language questions into restricted, read-only PostgreSQL queries.',
  'xt67/github-readme-stats': 'Archived fork of the GitHub profile statistics project. Upstream authorship and licensing remain with its contributors.',
  'xt67/Heartbeat-Classifier': 'An experimental ECG heartbeat classifier using a 1D CNN and the MIT-BIH dataset, with attention to class imbalance.',
  'xt67/Mars-Rover-Terrain-Segmentation': 'A terrain-segmentation pipeline for rover images, labelling soil, bedrock, sand and large rocks with DeepLabV3+.',
  'xt67/ML-Based-Vision': 'Turns relative monocular depth into coloured point clouds. Scale is relative, and individual frames are not fused into a map.',
  'xt67/ML-Paper-Reproducibility-Predictor': 'Examines research methods text for reporting gaps and offers reproducibility indicators and suggested improvements.',
  'xt67/NeuroSnake': 'A Snake-playing reinforcement-learning project using Double DQN, PyTorch and a NumPy network with manual backpropagation.',
  'xt67/Pune-AQI-Monitor': 'Pune environmental-data monitoring and visualisation. Live regional model estimates are distinguished from station measurements.',
  'xt67/Qatar-Water-Intelligence': 'Explores Qatar water-reservoir capacity data using Python, SQL, PostgreSQL and interactive visualisations.',
  'xt67/Robotic-Arm': 'A hand-tracking robotic-arm project combining computer vision, MediaPipe and Arduino servo control. See the repository for implementation and attribution.',
  'xt67/SlimZero': 'Local prompt compression and LLM workflow tooling, with response controls and circuit breakers for agent execution.',
  'xt67/xt67': 'The GitHub profile README repository for Rayan Rahman / xt67.',
  'xt67-Lab/buymeachai': 'An open-source UPI support-page project for Indian creators. Listed here as a software project; this portfolio does not collect donations.',
  'xt67-Lab/shlama-linux': 'An Ollama-powered terminal assistant that translates natural language into Linux command suggestions.',
  'xt67-Lab/shlama-windows': 'An Ollama-powered terminal assistant that translates natural language into PowerShell command suggestions.'
};

async function request(url) {
  const response = await fetch(url, {
    headers: {Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'},
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const limit = remaining === '0' ? ` Public API rate limit reached; retry after ${new Date(Number(reset) * 1000).toISOString()}.` : '';
    throw new Error(`GitHub ${response.status} at ${url}.${limit} Existing catalog was not changed.`);
  }
  return response.json();
}

function safeHomepage(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

async function listPublicRepositories(owner) {
  const results = [];
  for (let page = 1; page <= 100; page++) {
    const items = await request(`https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&type=owner&sort=full_name&page=${page}`);
    if (!Array.isArray(items)) throw new Error(`Unexpected repository response for ${owner}; catalog unchanged.`);
    for (const repo of items) {
      if (repo.private !== false || repo.owner?.login?.toLowerCase() !== owner.toLowerCase()) continue;
      const fullName = `${owner}/${repo.name}`;
      results.push({
        id: String(repo.id), fullName, name: repo.name, owner,
        url: `https://github.com/${fullName}`,
        description: summaries[fullName] || repo.description || 'Public repository. Open its README for project details.',
        language: repo.language || null, fork: Boolean(repo.fork), archived: Boolean(repo.archived),
        homepage: safeHomepage(repo.homepage),
        kind: fullName === 'xt67/xt67' ? 'profile' : repo.fork ? 'fork' : 'project'
      });
    }
    if (items.length < 100) return results;
  }
  throw new Error(`Pagination limit reached for ${owner}; catalog unchanged.`);
}

try {
  // Finish every request before touching the existing snapshot.
  const repositories = (await Promise.all(owners.map(listPublicRepositories))).flat()
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  if (new Set(repositories.map(repo => repo.id)).size !== repositories.length) throw new Error('Duplicate repository IDs; catalog unchanged.');
  const organizations = [
    {id: 'lab', owner: 'xt67-Lab', name: 'xt67-Lab', url: 'https://github.com/xt67-Lab', theme: 'research', description: 'A scientific research lab district in this portfolio, representing the xt67-Lab GitHub organization.'},
    {id: 'ccp', owner: 'Cat-Communist-Party-CCP', name: 'Cat Communist Party · CCP', url: 'https://github.com/Cat-Communist-Party-CCP', theme: 'crew', description: 'A fictional, mafia-film-inspired cat-crew hideout representing this GitHub organization. The game theme is not a claim about real-world activity.'}
  ].map(org => {
    const repositoryCount = repositories.filter(repo => repo.owner === org.owner).length;
    return {...org, repositoryCount, status: repositoryCount ? 'public-projects' : 'no-public-repositories'};
  });
  const catalogDate = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
  const output = `// Public repository snapshot. Refresh with: node scripts/refresh-catalog.mjs\n// Descriptions are editorial summaries, not independently reproduced results.\nexport const catalogDate = ${JSON.stringify(catalogDate)};\nexport const repositories = ${JSON.stringify(repositories, null, 2)};\nexport const organizations = ${JSON.stringify(organizations, null, 2)};\n`;
  await writeFile(temporary, output, 'utf8');
  await rename(temporary, target);
  console.log(`Saved ${repositories.length} public repository cards (${catalogDate}).`);
  organizations.forEach(org => console.log(`${org.owner}: ${org.repositoryCount} public repositories.`));
} catch (error) {
  await unlink(temporary).catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
}
