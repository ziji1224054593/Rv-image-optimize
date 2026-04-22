import packageInfo from '../package.json';
import agentsContent from '../AGENTS.md?raw';
import aiToolkitContent from '../AI_TOOLKIT.md?raw';
import changelogContent from '../CHANGELOG.md?raw';
import readmeContent from '../README.md?raw';
import multiLanguageCliContent from '../MULTI_LANGUAGE_CLI_USAGE.md?raw';
import nodeCliContent from '../NODE_CLI_COMPRESS.md?raw';
import staticImageBuildPluginContent from '../STATIC_IMAGE_BUILD_PLUGIN.md?raw';
import uploadPipelineContent from '../UPLOAD_PIPELINE.md?raw';
import agentIntegrationContent from '../AGENT_INTEGRATION.md?raw';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractCurrentRelease(changelog, version) {
  const versionTag = `v${version}`;
  const pattern = new RegExp(`##\\s+${escapeRegex(versionTag)}\\n([\\s\\S]*?)(\\n##\\s+v|$)`, 'm');
  const match = String(changelog || '').match(pattern);
  const section = match?.[1] || '';
  const dateMatch = section.match(/发布时间：([^\n]+)/);
  const bulletMatches = [...section.matchAll(/^- (.+)$/gm)].map((item) => item[1].trim());

  return {
    version,
    title: `${versionTag} 最新更新公告`,
    date: dateMatch?.[1]?.trim() || '',
    summary: bulletMatches[0] || '当前版本已更新，请在文档浏览中查看详细说明。',
    highlights: bulletMatches.length > 0
      ? bulletMatches
      : ['当前版本已更新，请在文档浏览中查看详细说明。'],
  };
}

const currentReleaseFromChangelog = extractCurrentRelease(changelogContent, packageInfo.version);

export const CURRENT_RELEASE = {
  ...currentReleaseFromChangelog,
  quickLinks: [
    { docId: 'changelog', label: '查看 Changelog' },
    { docId: 'readme', label: '查看 README' },
    { docId: 'agents', label: '查看 AGENTS' },
    { docId: 'ai-toolkit', label: '查看 AI Toolkit' },
    { docId: 'node-cli', label: '查看 Node / CLI 使用方式' },
    { docId: 'multi-language-cli', label: '查看多语言 CLI 调用' },
    { docId: 'static-image-build-plugin', label: '查看静态图片打包压缩' },
    { docId: 'upload-pipeline', label: '查看 Upload Pipeline' },
    { docId: 'agent-integration', label: '查看 Agent Integration' },
  ],
};

export const RELEASE_DOCS = [
  {
    id: 'changelog',
    title: 'Changelog',
    description: '版本更新记录与最近变更摘要',
    content: changelogContent,
  },
  {
    id: 'readme',
    title: 'README',
    description: '总览安装、入口、主要能力和 FAQ',
    content: readmeContent,
  },
  {
    id: 'agents',
    title: 'AGENTS',
    description: '仓库级 Agent 规则，适合支持自动读取仓库指引的 AI',
    content: agentsContent,
  },
  {
    id: 'ai-toolkit',
    title: 'AI Toolkit',
    description: '专门给 AI / Agent 使用的工具摘要、入口映射和提示词模板',
    content: aiToolkitContent,
  },
  {
    id: 'node-cli',
    title: 'Node / CLI',
    description: 'Node API、CLI 参数、文件后处理与批处理说明',
    content: nodeCliContent,
  },
  {
    id: 'multi-language-cli',
    title: 'Multi Language CLI Usage',
    description: 'Java、Python、PHP 等后端通过 CLI 调用图片压缩能力',
    content: multiLanguageCliContent,
  },
  {
    id: 'static-image-build-plugin',
    title: 'Static Image Build Plugin',
    description: 'Vite 构建后静态图片打包压缩插件说明',
    content: staticImageBuildPluginContent,
  },
  {
    id: 'upload-pipeline',
    title: 'Upload Pipeline',
    description: '压缩后上传、upload-core / upload 和表单配置说明',
    content: uploadPipelineContent,
  },
  {
    id: 'agent-integration',
    title: 'Agent Integration',
    description: 'Cursor、Claude Code、skills 型 Agent 的 CLI 接入说明',
    content: agentIntegrationContent,
  },
];
