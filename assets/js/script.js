  
const aboutPortrait = document.querySelector('.about-editorial__portrait img');

// Seletor do Formulário
const formulario = document.querySelector('#formulario');

// Regex de validação do e-mail
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function getAboutGithub() {
  try {
    const resposta = await fetch('https://api.github.com/users/paulobrandao26');
    if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);
    const perfil = await resposta.json();

    if (perfil.avatar_url && aboutPortrait) {
      aboutPortrait.src = perfil.avatar_url;
      aboutPortrait.alt = `Foto de perfil de ${perfil.name || 'Paulo Brandão'}`;
    }

    document.querySelector('[data-profile-followers]').textContent = perfil.followers;
    document.querySelector('[data-profile-repos]').textContent = perfil.public_repos;
  } catch (error) {
    console.error('Não foi possível carregar os dados do GitHub:', error);
  }
}

getAboutGithub();

// Projetos destacados em capítulos: o painel acompanha a leitura sem controlar o scroll.
const linguagens = {
  JavaScript: 'javascript', TypeScript: 'typescript', Python: 'python', Java: 'java',
  HTML: 'html', CSS: 'css', PHP: 'php', 'C#': 'csharp', Go: 'go', Kotlin: 'kotlin', Swift: 'swift',
};

const nomesProjetos = {
  'publicai-monitor-web': 'PublicAI Monitor Web',
  'publicai-monitor-api': 'PublicAI Monitor API',
  'agenda-barbearia': 'Agenda Barbearia',
  'app-minha-compras': 'App Minha Compras',
  'site-lojafit': 'Site Loja Fit',
  'loja-fit-backend': 'Loja Fit Backend',
};

function nomeLegivel(nome) {
  if (nomesProjetos[nome.toLowerCase()]) return nomesProjetos[nome.toLowerCase()];
  return nome.replace(/[-_]/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function atualizarCapitulo(capitulo, repositorio, indice) {
  const nome = nomeLegivel(repositorio.name);
  const linguagem = repositorio.language || 'Repositório público';
  const descricao = repositorio.description || 'Explore o código, as tecnologias e o histórico deste projeto no GitHub.';
  const icone = linguagens[repositorio.language] || 'github';
  const link = capitulo.querySelector('a');

  capitulo.querySelector('h3').textContent = nome;
  capitulo.querySelector('[data-chapter-description]').textContent = descricao;
  capitulo.dataset.number = String(indice + 1).padStart(2, '0');
  link.href = repositorio.html_url;

  if (repositorio.homepage) {
    let deploy = capitulo.querySelector('[data-deploy-link]');
    if (!deploy) {
      deploy = document.createElement('a');
      deploy.dataset.deployLink = '';
      deploy.className = 'project-chapter__deploy';
      deploy.target = '_blank';
      deploy.rel = 'noopener noreferrer';
      deploy.textContent = 'Ver versão publicada ↗';
      capitulo.append(deploy);
    }
    deploy.href = repositorio.homepage;
  }

  if (indice === 0) atualizarPainel(repositorio, icone, nome, linguagem, descricao);
}

function atualizarPainel(repositorio, icone, nome, linguagem, descricao) {
  document.querySelector('[data-stage-icon]').src = `./assets/icons/languages/${icone}.svg`;
  document.querySelector('[data-stage-language]').textContent = linguagem;
  document.querySelector('[data-stage-name]').textContent = nome;
  document.querySelector('[data-stage-description]').textContent = descricao;
  document.querySelector('[data-stage-link]').textContent = repositorio.homepage ? 'PROJETO PUBLICADO ↗' : 'REPOSITÓRIO NO GITHUB ↗';

  const topics = repositorio.topics?.length ? repositorio.topics.slice(0, 3) : [linguagem, 'Open source'];
  const topicContainer = document.querySelector('[data-stage-topics]');
  topicContainer.replaceChildren(...topics.map((topic) => {
    const tag = document.createElement('span');
    tag.textContent = topic;
    return tag;
  }));
}

function observarCapitulos() {
  const capitulos = [...document.querySelectorAll('.project-chapter')];
  const scrollMomentSupported = matchMedia('(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)').matches;
  if (!('IntersectionObserver' in window) || capitulos.length === 0 || !scrollMomentSupported) return;

  const observer = new IntersectionObserver((entradas) => {
    const visiveis = entradas.filter((entrada) => entrada.isIntersecting);
    if (!visiveis.length) return;
    const atual = visiveis.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0].target;
    const indice = capitulos.indexOf(atual);
    capitulos.forEach((capitulo, posicao) => {
      capitulo.classList.toggle('is-active', posicao === indice);
      if (posicao === indice) atualizarPainel({
        name: capitulo.querySelector('h3').textContent,
        language: capitulo.dataset.language || 'GitHub',
        description: capitulo.querySelector('[data-chapter-description]').textContent,
        html_url: capitulo.querySelector('a').href,
        topics: capitulo.dataset.topics ? capitulo.dataset.topics.split(',') : [],
        homepage: capitulo.dataset.homepage || '',
      }, linguagens[capitulo.dataset.language] || 'github', capitulo.querySelector('h3').textContent, capitulo.dataset.language || 'GitHub', capitulo.querySelector('[data-chapter-description]').textContent);
    });
    document.querySelector('[data-stage-number]').textContent = atual.dataset.number;
  }, { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.2, 0.6] });

  capitulos.forEach((capitulo) => observer.observe(capitulo));
}

async function getProjectsGithub() {
  const destaques = ['publicai-monitor-web', 'publicai-monitor-api', 'agenda-barbearia'];
  const arquivo = ['app-minha-compras', 'Site-lojaFit', 'loja-fit-backend'];

  try {
    const resposta = await fetch('https://api.github.com/users/paulobrandao26/repos?sort=updated&per_page=100');
    if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);
    const repositorios = await resposta.json();
    const porNome = new Map(repositorios.map((repositorio) => [repositorio.name.toLowerCase(), repositorio]));

    destaques.forEach((nome, indice) => {
      const repositorio = porNome.get(nome.toLowerCase());
      const capitulo = document.querySelector(`[data-project="${nome.toLowerCase()}"]`);
      if (!repositorio || !capitulo) return;
      capitulo.dataset.language = repositorio.language || 'GitHub';
      capitulo.dataset.topics = (repositorio.topics || []).join(',');
      capitulo.dataset.homepage = repositorio.homepage || '';
      atualizarCapitulo(capitulo, repositorio, indice);
    });

    const lista = document.querySelector('#project-archive-list');
    const itens = arquivo.map((nome) => porNome.get(nome.toLowerCase())).filter(Boolean);
    if (lista && itens.length) {
      lista.replaceChildren(...itens.map((repositorio) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        const nome = document.createElement('span');
        const detalhes = document.createElement('span');
        nome.textContent = nomeLegivel(repositorio.name);
        detalhes.textContent = `${repositorio.language || 'GitHub'} ↗`;
        link.href = repositorio.html_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.append(nome, detalhes);
        item.append(link);
        return item;
      }));
    }
  } catch (error) {
    console.error('Não foi possível carregar os projetos do GitHub:', error);
  }
}

getProjectsGithub();
observarCapitulos();

// Função de Validação do Formulário
formulario.addEventListener('submit', function (event) {
  event.preventDefault();

  document.querySelectorAll('form span')
    .forEach(span => span.innerHTML = '');

  let isValid = true;

  const nome = document.querySelector('#nome');
  const erroNome = document.querySelector('#erro-nome');

  if (nome.value.trim().length < 3) {
    erroNome.innerHTML = 'O Nome deve ter no mínimo 3 caracteres.';
    if (isValid) nome.focus();
    isValid = false;
  }

  const email = document.querySelector('#email');
  const erroEmail = document.querySelector('#erro-email');

  if (!email.value.trim().match(emailRegex)) {
    erroEmail.innerHTML = 'Digite um e-mail válido.';
    if (isValid) email.focus();
    isValid = false;
  }

  const assunto = document.querySelector('#assunto');
  const erroAssunto = document.querySelector('#erro-assunto');

  if (assunto.value.trim().length < 5) {
    erroAssunto.innerHTML = 'O Assunto deve ter no mínimo 5 caracteres.';
    if (isValid) assunto.focus();
    isValid = false;
  }

  const mensagem = document.querySelector('#mensagem');
  const erroMensagem = document.querySelector('#erro-mensagem');

  if (mensagem.value.trim().length === 0) {
    erroMensagem.innerHTML = 'A mensagem não pode ser vazia.';
    if (isValid) mensagem.focus();
    isValid = false;
  }

  if (isValid) {
    const submitButton = formulario.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    formulario.submit();
  }
});

