  
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

const descricoesProjetos = {
  'publicai-monitor-web': 'Interface para acompanhar licitações públicas e encontrar oportunidades.',
  'publicai-monitor-api': 'Serviço que resume licitações públicas com inteligência artificial.',
  'agenda-barbearia': 'Sistema de agendamento que organiza horários de uma barbearia.',
  'app-minha-compras': 'Aplicativo para acompanhar compras feitas no cartão de crédito.',
  'site-lojafit': 'Loja virtual de produtos fitness.',
  'loja-fit-backend': 'Serviços que dão suporte às operações da Loja Fit.',
};

function nomeLegivel(nome) {
  if (nomesProjetos[nome.toLowerCase()]) return nomesProjetos[nome.toLowerCase()];
  return nome.replace(/[-_]/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function atualizarCapitulo(capitulo, repositorio, indice) {
  const nome = nomeLegivel(repositorio.name);
  const linguagem = repositorio.language || 'Repositório público';
  const descricao = descricoesProjetos[repositorio.name.toLowerCase()] || 'Confira este projeto no GitHub.';
  const icone = linguagens[repositorio.language] || 'github';
  const link = capitulo.querySelector('a');

  capitulo.querySelector('h3').textContent = nome;
  capitulo.querySelector('[data-chapter-description]').textContent = descricao;
  capitulo.dataset.number = String(indice + 1).padStart(2, '0');
  link.href = repositorio.html_url;

  let deploy = capitulo.querySelector('[data-deploy-link]');
  if (repositorio.homepage) {
    if (!deploy) {
      deploy = document.createElement('a');
      deploy.dataset.deployLink = '';
      deploy.className = 'button button--deploy project-chapter__deploy';
      deploy.target = '_blank';
      deploy.rel = 'noopener noreferrer';
      deploy.textContent = 'Deploy ↗';
      capitulo.append(deploy);
    }
    deploy.href = repositorio.homepage;
  } else {
    deploy?.remove();
    deploy = null;
  }

  if (indice === 0) atualizarPainel(icone, nome, descricao, link.href, deploy?.href);
}

function atualizarPainel(icone, nome, descricao, githubUrl, deployUrl) {
  document.querySelector('[data-stage-icon]').src = `./assets/icons/languages/${icone}.svg`;
  document.querySelector('[data-stage-name]').textContent = nome;
  document.querySelector('[data-stage-description]').textContent = descricao;
  const github = document.querySelector('[data-stage-github]');
  const deploy = document.querySelector('[data-stage-deploy]');
  github.href = githubUrl;
  deploy.hidden = !deployUrl;
  if (deployUrl) deploy.href = deployUrl;
}

function observarCapitulos() {
  const capitulos = [...document.querySelectorAll('.project-chapter')];
  const scrollMomentSupported = matchMedia('(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)').matches;
  if (!('IntersectionObserver' in window) || capitulos.length === 0 || !scrollMomentSupported) return;

  const observer = new IntersectionObserver(() => {
    const centro = window.innerHeight * 0.5;
    const atual = capitulos.find((capitulo) => {
      const quadro = capitulo.getBoundingClientRect();
      return quadro.top <= centro && quadro.bottom >= centro;
    });
    if (!atual) return;

    const indice = capitulos.indexOf(atual);
    capitulos.forEach((capitulo, posicao) => {
      capitulo.classList.toggle('is-active', posicao === indice);
      if (posicao === indice) atualizarPainel(
        linguagens[capitulo.dataset.language] || 'github',
        capitulo.querySelector('h3').textContent,
        capitulo.querySelector('[data-chapter-description]').textContent,
        capitulo.querySelector('a:not([data-deploy-link])').href,
        capitulo.querySelector('[data-deploy-link]')?.href,
      );
    });
  }, { rootMargin: '-49% 0px -49% 0px', threshold: 0 });

  capitulos.forEach((capitulo) => observer.observe(capitulo));
}

async function getProjectsGithub() {
  const destaques = ['publicai-monitor-web', 'Site-lojaFit', 'agenda-barbearia'];
  const arquivo = ['app-minha-compras', 'publicai-monitor-api', 'loja-fit-backend'];

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
      itens.forEach((repositorio) => {
        const item = lista.querySelector(`[data-archive-repo="${repositorio.name.toLowerCase()}"]`);
        if (!item) return;

        item.querySelector('[data-archive-name]').textContent = nomeLegivel(repositorio.name);
        item.querySelector('[data-archive-github]').href = repositorio.html_url;

        let deploy = item.querySelector('[data-archive-deploy]');
        if (repositorio.homepage) {
          if (!deploy) {
            deploy = document.createElement('a');
            deploy.className = 'button button--deploy';
            deploy.dataset.archiveDeploy = '';
            deploy.target = '_blank';
            deploy.rel = 'noopener noreferrer';
            deploy.textContent = 'Deploy ↗';
            item.querySelector('.archive-actions').append(deploy);
          }
          deploy.href = repositorio.homepage;
        } else if (deploy) {
          deploy.remove();
        }
      });
    }
  } catch (error) {
    console.error('Não foi possível carregar os projetos do GitHub:', error);
  }
}

getProjectsGithub();
observarCapitulos();

function colorirRetratoAoRolar() {
  const portrait = document.querySelector('.about-editorial__portrait');
  if (!portrait || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (CSS.supports('animation-timeline: view()')) return;
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(([entry]) => {
    portrait.classList.toggle('is-scroll-visible', entry.isIntersecting);
  }, { threshold: 0.15 });
  observer.observe(portrait);
}

colorirRetratoAoRolar();

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

