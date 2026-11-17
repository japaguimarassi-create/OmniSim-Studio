import { useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import JSZip from 'jszip'
import {
  Braces, Code2, Download, FilePlus2, Files, Folder, Gamepad2,
  Globe2, Monitor, Play, RefreshCw, Smartphone, Trash2, Upload, X
} from 'lucide-react'

type ProjectFile = { path: string; content: string }
type ProjectKind = 'website' | 'game'
type MobileTab = 'files' | 'editor' | 'preview'

const STORAGE_KEY = 'omnisim-studio-workspace-v1'

const websiteFiles: ProjectFile[] = [
  {
    path: 'index.html',
    content: `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Meu primeiro projeto</title>
</head>
<body>
  <main class="hero">
    <span class="eyebrow">SEU ESPAÇO DE CRIAÇÃO</span>
    <h1>Ideias viram experiências.</h1>
    <p>Edite o código e veja o resultado aparecer aqui.</p>
    <button id="action">Testar interação</button>
  </main>
</body>
</html>`
  },
  {
    path: 'styles.css',
    content: `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: radial-gradient(circle at 20% 10%, #25375c, #0b1020 58%);
  color: #f4f7ff;
  font-family: Inter, system-ui, sans-serif;
}
.hero { width: min(620px, 100%); }
.eyebrow { color: #9bb8ff; font-size: 12px; letter-spacing: .18em; }
h1 { max-width: 560px; margin: 18px 0; font-size: clamp(38px, 8vw, 76px); line-height: .98; }
p { color: #aab6ce; font-size: 17px; line-height: 1.7; }
button { border: 0; border-radius: 9px; padding: 13px 18px; background: #8da9ff; color: #0b1020; font-weight: 700; cursor: pointer; }
button:hover { background: #b2c4ff; }`
  },
  {
    path: 'main.js',
    content: `const action = document.querySelector('#action')
let count = 0

action?.addEventListener('click', () => {
  count += 1
  action.textContent = `Você clicou ${count} vez(es)`
})`
  }
]

const gameFiles: ProjectFile[] = [
  {
    path: 'index.html',
    content: `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Canvas Lab</title>
</head>
<body>
  <main class="game-shell">
    <div class="game-heading"><span>CANVAS LAB</span><strong>Toque ou clique para mover</strong></div>
    <canvas id="game" width="800" height="460"></canvas>
    <p>Experimento 01 · Movimento e colisão visual</p>
  </main>
</body>
</html>`
  },
  {
    path: 'styles.css',
    content: `* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 20px; background: #0c1220; color: #eaf0ff; font-family: Inter, system-ui, sans-serif; }
.game-shell { width: min(900px, 100%); }
.game-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; color: #91a6d1; font-size: 11px; letter-spacing: .13em; }
.game-heading strong { color: #eaf0ff; letter-spacing: 0; font-weight: 500; }
canvas { display: block; width: 100%; height: auto; border: 1px solid #263958; border-radius: 12px; background: #101b2e; touch-action: manipulation; }
p { color: #8192b4; font-size: 12px; }`
  },
  {
    path: 'game.js',
    content: `const canvas = document.querySelector('#game')
const ctx = canvas?.getContext('2d')
let player = { x: 120, y: 230, radius: 17 }
let target = { x: 620, y: 230 }

function draw() {
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#203451'
  ctx.lineWidth = 1
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
  }
  ctx.fillStyle = '#718bbd'
  ctx.beginPath(); ctx.arc(target.x, target.y, 25, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#9bb7ff'
  ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#eaf0ff'
  ctx.font = '14px system-ui'
  ctx.fillText('OMNISIM · CANVAS', 22, 30)
}

canvas?.addEventListener('pointerdown', event => {
  const rect = canvas.getBoundingClientRect()
  player.x = (event.clientX - rect.left) * canvas.width / rect.width
  player.y = (event.clientY - rect.top) * canvas.height / rect.height
  draw()
})

draw()`
  }
]

function loadWorkspace(): ProjectFile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return websiteFiles
    const parsed = JSON.parse(saved) as ProjectFile[]
    if (Array.isArray(parsed) && parsed.length && parsed.every(file => typeof file.path === 'string' && typeof file.content === 'string')) return parsed
  } catch {
    return websiteFiles
  }
  return websiteFiles
}

function cleanPath(value: string): string {
  return value.trim().replace(/\\/g, '/').split('/').filter(part => part && part !== '.' && part !== '..').join('/')
}

function getLanguage(path: string) {
  const ext = path.toLowerCase().split('.').pop()
  if (ext === 'html' || ext === 'htm') return html()
  if (ext === 'css') return css()
  if (ext === 'ts' || ext === 'tsx') return javascript({ typescript: true, jsx: ext === 'tsx' })
  if (ext === 'js' || ext === 'jsx' || ext === 'mjs') return javascript({ jsx: ext === 'jsx' })
  return []
}

function makePreview(files: ProjectFile[]) {
  const htmlFile = files.find(file => file.path.toLowerCase().split('/').pop() === 'index.html')
  const styles = files.filter(file => file.path.toLowerCase().endsWith('.css')).map(file => file.content).join('\n')
  const scripts = files.filter(file => /\.(js|mjs)$/i.test(file.path)).map(file => file.content).join('\n')
  const policy = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">'
  let documentText = htmlFile?.content ?? '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Preview</title></head><body><p>Crie um index.html para começar.</p></body></html>'
  if (/<head[^>]*>/i.test(documentText)) {
    documentText = documentText.replace(/<head[^>]*>/i, match => match + policy + (styles ? `<style>\n${styles}\n</style>` : ''))
  } else {
    documentText = documentText.replace(/<html[^>]*>/i, match => match + `<head>${policy}${styles ? `<style>${styles}</style>` : ''}</head>`)
  }
  const safeScripts = scripts.replace(/<\/script/gi, '<\\/script')
  const scriptBlock = safeScripts ? `<script>\n${safeScripts}\n</script>` : ''
  if (/<\/body>/i.test(documentText)) documentText = documentText.replace(/<\/body>/i, scriptBlock + '</body>')
  else documentText += scriptBlock
  return documentText
}

function App() {
  const [files, setFiles] = useState<ProjectFile[]>(loadWorkspace)
  const [activePath, setActivePath] = useState('index.html')
  const [projectName, setProjectName] = useState('Meu projeto')
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor')
  const [previewVersion, setPreviewVersion] = useState(0)
  const [toast, setToast] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const activeFile = files.find(file => file.path === activePath) ?? files[0]
  const previewDocument = useMemo(() => makePreview(files), [files, previewVersion])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
    } catch {
      setToast('Não foi possível salvar. Exporte o ZIP para preservar o projeto.')
    }
  }, [files])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function updateContent(value: string) {
    if (!activeFile) return
    setFiles(current => current.map(file => file.path === activeFile.path ? { ...file, content: value } : file))
  }

  function newFile() {
    const input = window.prompt('Caminho do novo arquivo', 'src/new.js')
    if (!input) return
    const path = cleanPath(input)
    if (!path || files.some(file => file.path === path)) {
      setToast('Nome inválido ou arquivo já existente.')
      return
    }
    setFiles(current => [...current, { path, content: '' }])
    setActivePath(path)
    setMobileTab('editor')
  }

  function deleteFile(path: string) {
    if (files.length <= 1) {
      setToast('O projeto precisa manter pelo menos um arquivo.')
      return
    }
    const next = files.filter(file => file.path !== path)
    setFiles(next)
    if (activePath === path) setActivePath(next[0].path)
  }

  function startProject(kind: ProjectKind) {
    const next = kind === 'game' ? gameFiles : websiteFiles
    setFiles(next)
    setProjectName(kind === 'game' ? 'Canvas Lab' : 'Meu projeto')
    setActivePath('index.html')
    setPreviewVersion(value => value + 1)
    setMobileTab('editor')
    setToast(kind === 'game' ? 'Projeto Canvas criado.' : 'Projeto web criado.')
  }

  async function exportZip() {
    try {
      const zip = new JSZip()
      files.forEach(file => zip.file(file.path, file.content))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${projectName.trim().replace(/[^a-z0-9-_]+/gi, '-') || 'omnisim-project'}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
      setToast('ZIP exportado.')
    } catch {
      setToast('Falha ao exportar o ZIP.')
    }
  }

  async function importZip(file?: File) {
    if (!file) return
    if (file.size > 12 * 1024 * 1024) {
      setToast('O ZIP excede o limite de 12 MB.')
      return
    }
    try {
      const zip = await JSZip.loadAsync(file)
      const next: ProjectFile[] = []
      let totalBytes = 0
      for (const [name, entry] of Object.entries(zip.files)) {
        if (entry.dir || next.length >= 100) continue
        const path = cleanPath(name)
        if (!path || !/\.(html?|css|[cm]?js|jsx|tsx?|json|md|txt|xml|ya?ml|svg|toml|ini|csv|sh)$/i.test(path)) continue
        const content = await entry.async('string')
        totalBytes += new TextEncoder().encode(content).length
        if (totalBytes > 8 * 1024 * 1024) throw new Error('Workspace muito grande')
        next.push({ path, content })
      }
      if (!next.length) throw new Error('Nenhum arquivo de texto encontrado')
      setFiles(next)
      setActivePath(next.some(file => file.path === 'index.html') ? 'index.html' : next[0].path)
      setProjectName(file.name.replace(/\.zip$/i, ''))
      setPreviewVersion(value => value + 1)
      setToast(`${next.length} arquivo(s) importado(s).`)
    } catch {
      setToast('Não foi possível importar esse ZIP.')
    }
    if (importRef.current) importRef.current.value = ''
  }

  const fileCount = files.length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Braces size={20} /></div>
          <div><strong>OMNISIM</strong><span>STUDIO</span></div>
        </div>
        <div className="topbar-divider" />
        <div className="project-label"><span>WORKSPACE</span><strong>{projectName}</strong></div>
        <div className="topbar-actions">
          <button className="tool-button" onClick={() => importRef.current?.click()} title="Importar ZIP"><Upload size={16} /><span>Importar</span></button>
          <button className="tool-button" onClick={exportZip} title="Exportar ZIP"><Download size={16} /><span>Exportar</span></button>
          <button className="primary-button" onClick={() => { setPreviewVersion(value => value + 1); setMobileTab('preview') }}><Play size={15} fill="currentColor" /><span>Executar</span></button>
        </div>
      </header>

      <div className="workspace-heading">
        <div><span className="breadcrumb">PROJETOS /</span><strong>{projectName}</strong><span className="saved-dot" /> <small>salvo neste dispositivo</small></div>
        <div className="workspace-heading-actions">
          <button onClick={() => startProject('website')}><Globe2 size={14} /> Site</button>
          <button onClick={() => startProject('game')}><Gamepad2 size={14} /> Jogo 2D</button>
          <button onClick={newFile}><FilePlus2 size={14} /> Novo arquivo</button>
        </div>
      </div>

      <main className="studio-grid">
        <aside className={`file-panel mobile-${mobileTab}`}>
          <div className="panel-heading"><div><Folder size={15} /><span>EXPLORADOR</span></div><button onClick={newFile} title="Novo arquivo"><FilePlus2 size={15} /></button></div>
          <div className="project-tree">
            <div className="tree-root"><Folder size={14} /><span>{projectName}</span><small>{fileCount} arquivos</small></div>
            {files.map(file => (
              <div className={`tree-row ${activePath === file.path ? 'active' : ''}`} key={file.path}>
                <button className="file-select" onClick={() => { setActivePath(file.path); setMobileTab('editor') }}>
                  <Files size={14} /><span>{file.path}</span>
                </button>
                <button className="delete-file" onClick={() => deleteFile(file.path)} title="Excluir arquivo"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <div className="panel-footer"><span>ARMAZENAMENTO LOCAL</span><strong>{fileCount} arquivos</strong></div>
        </aside>

        <section className={`editor-panel mobile-${mobileTab}`}>
          <div className="editor-toolbar">
            <div className="editor-file"><Code2 size={15} /><strong>{activeFile?.path ?? 'Nenhum arquivo'}</strong><span className="language-tag">{activeFile?.path.split('.').pop()?.toUpperCase() ?? 'TEXT'}</span></div>
            <div className="editor-actions"><span className="online-dot" /> <small>LOCAL</small><button onClick={() => setToast('O workspace é salvo automaticamente no navegador.')} title="Status de salvamento"><RefreshCw size={14} /></button></div>
          </div>
          <div className="code-host">
            {activeFile ? (
              <CodeMirror
                value={activeFile.content}
                height="100%"
                theme={oneDark}
                extensions={getLanguage(activeFile.path)}
                onChange={updateContent}
                basicSetup={{ foldGutter: true, dropCursor: false, allowMultipleSelections: false, indentOnInput: true, lineNumbers: true }}
              />
            ) : <div className="empty-state">Selecione ou crie um arquivo.</div>}
          </div>
          <div className="editor-status"><span>UTF-8</span><span>Spaces: 2</span><span>{activeFile?.content.length ?? 0} caracteres</span></div>
        </section>

        <section className={`preview-panel mobile-${mobileTab}`}>
          <div className="preview-toolbar">
            <div><span className="live-dot" /><strong>PRÉVIA AO VIVO</strong></div>
            <div className="preview-actions"><span><Monitor size={13} /> ISOLADA</span><button onClick={() => setPreviewVersion(value => value + 1)} title="Atualizar prévia"><RefreshCw size={14} /></button></div>
          </div>
          <div className="browser-bar"><span className="browser-dots"><i /><i /><i /></span><div><span className="lock">◈</span> localhost / preview</div></div>
          <iframe key={previewVersion} title="Prévia isolada do projeto" sandbox="allow-scripts" srcDoc={previewDocument} />
          <div className="preview-footer"><span><span className="online-dot" /> Execução no navegador</span><span>Sem acesso ao editor</span></div>
        </section>
      </main>

      <nav className="mobile-nav">
        <button className={mobileTab === 'files' ? 'selected' : ''} onClick={() => setMobileTab('files')}><Folder size={17} /><span>Arquivos</span></button>
        <button className={mobileTab === 'editor' ? 'selected' : ''} onClick={() => setMobileTab('editor')}><Code2 size={17} /><span>Editor</span></button>
        <button className={mobileTab === 'preview' ? 'selected' : ''} onClick={() => setMobileTab('preview')}><Smartphone size={17} /><span>Prévia</span></button>
      </nav>

      <input ref={importRef} type="file" accept=".zip,application/zip" hidden onChange={event => void importZip(event.target.files?.[0])} />
      {toast && <div className="toast" role="status"><span>{toast}</span><button onClick={() => setToast('')} aria-label="Fechar aviso"><X size={14} /></button></div>}
    </div>
  )
}

export default App
