/**
 * GitHub API Helper for Committing Generated Static Blog Files
 */

function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_MAIN_WEBSITE_REPO;
  const branch = process.env.GITHUB_MAIN_WEBSITE_BRANCH || 'main';

  return { token, owner, repo, branch };
}

/**
 * Returns headers for GitHub API requests.
 */
function getHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

/**
 * Reads a file from the repository if it exists.
 * @param {string} filePath 
 * @returns {Promise<{ content: string, sha: string } | null>}
 */
export async function getRepoFile(filePath) {
  const { token, owner, repo, branch } = getGitHubConfig();
  if (!token || !owner || !repo) {
    return null;
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to read file from GitHub (${cleanPath}): ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content, sha: data.sha };
}

/**
 * Commits multiple files atomically using the GitHub Git Database (Trees & Commits) API.
 * Preserves all existing files and directory structure of the website.
 * @param {Array<{ path: string, content: string }>} files 
 * @param {string} commitMessage 
 * @returns {Promise<{ commitSha: string, commitUrl: string }>}
 */
export async function commitFilesToRepo(files, commitMessage) {
  const { token, owner, repo, branch } = getGitHubConfig();

  if (!token || !owner || !repo) {
    throw new Error(
      'GitHub integration is not fully configured. Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_MAIN_WEBSITE_REPO in your environment.'
    );
  }

  const headers = getHeaders(token);
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  // 1. Get reference to current branch head commit
  const refRes = await fetch(`${baseUrl}/git/ref/heads/${branch}`, { headers });
  if (!refRes.ok) {
    const err = await refRes.json().catch(() => ({}));
    throw new Error(`Failed to get branch ref 'heads/${branch}': ${err.message || refRes.statusText}`);
  }
  const refData = await refRes.json();
  const currentCommitSha = refData.object.sha;

  // 2. Get the commit to find base tree SHA
  const commitRes = await fetch(`${baseUrl}/git/commits/${currentCommitSha}`, { headers });
  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to get commit ${currentCommitSha}: ${err.message || commitRes.statusText}`);
  }
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs for all updated files
  const treeNodes = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(`${baseUrl}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      });

      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}));
        throw new Error(`Failed to create blob for ${file.path}: ${err.message || blobRes.statusText}`);
      }

      const blobData = await blobRes.json();
      return {
        path: file.path.replace(/^\/+/, ''),
        mode: '100644', // standard file mode
        type: 'blob',
        sha: blobData.sha,
      };
    })
  );

  // 4. Create new tree referencing the base tree
  const treeRes = await fetch(`${baseUrl}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeNodes,
    }),
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git tree: ${err.message || treeRes.statusText}`);
  }
  const treeData = await treeRes.json();

  // 5. Create new commit
  const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: treeData.sha,
      parents: [currentCommitSha],
    }),
  });

  if (!newCommitRes.ok) {
    const err = await newCommitRes.json().catch(() => ({}));
    throw new Error(`Failed to create commit: ${err.message || newCommitRes.statusText}`);
  }
  const newCommitData = await newCommitRes.json();

  // 6. Update branch head to new commit
  const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitData.sha,
      force: false,
    }),
  });

  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(`Failed to update branch head: ${err.message || updateRefRes.statusText}`);
  }

  return {
    commitSha: newCommitData.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`,
  };
}
