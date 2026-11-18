/* ============================================================
   Portfólio Paulo Brandão
   1) Dados do GitHub (foto e projetos)
   2) Formulário com validação
   3) Efeitos de scroll (GSAP + Lenis). Se as bibliotecas não carregarem
      ou o usuário pedir "menos movimento", o site funciona sem eles.
   ============================================================ */

const raiz = document.documentElement;
const reduzirMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const temBibliotecas = Boolean(window.gsap && window.ScrollTrigger && window.Lenis);
const animar = temBibliotecas && !reduzirMovimento;
if (!animar) raiz.classList.remove('anim');

/* ---------- 1) GitHub ---------- */
const USUARIO = 'paulobrandao26';

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
  const conhecido = nomesProjetos[nome.toLowerCase()];
  if (conhecido) return conhecido;
  return nome.replace(/[-_]/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase());
}

async function carregarPerfil() {
  const foto = document.querySelector('.sobre__foto img');
  try {
    const resposta = await fetch(`https://api.github.com/users/${USUARIO}`);
    if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);
    const perfil = await resposta.json();
    if (perfil.avatar_url && foto) {
      foto.src = perfil.avatar_url;
      foto.alt = `Foto de perfil de ${perfil.name || 'Paulo Brandão'}`;
    }
  } catch (erro) {
    console.error('Não foi possível carregar o perfil do GitHub:', erro);
  }
}

function atualizarQuadro(quadro, repositorio) {
  const chave = repositorio.name.toLowerCase();
  quadro.querySelector('[data-name]').textContent = nomeLegivel(repositorio.name);
  quadro.querySelector('[data-desc]').textContent = descricoesProjetos[chave] || 'Confira este projeto no GitHub.';
  quadro.querySelector('[data-github]').href = repositorio.html_url;

  quadro.querySelector('[data-lang]').textContent = repositorio.language || 'Repositório público';
  quadro.querySelector('[data-lang-icon]').src =
    `./assets/icons/languages/${linguagens[repositorio.language] || 'github'}.svg`;

  let deploy = quadro.querySelector('[data-deploy]');
  if (repositorio.homepage) {
    if (!deploy) {
      deploy = document.createElement('a');
      deploy.className = 'botao botao--branco';
      deploy.dataset.deploy = '';
      deploy.target = '_blank';
      deploy.rel = 'noopener noreferrer';
      deploy.textContent = 'Ver online';
      quadro.querySelector('.quadro__acoes').append(deploy);
    }
    deploy.href = repositorio.homepage;
  } else {
    deploy?.remove();
  }
}

async function carregarProjetos() {
  try {
    const resposta = await fetch(`https://api.github.com/users/${USUARIO}/repos?sort=updated&per_page=100`);
    if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);
    const repositorios = await resposta.json();
    const porNome = new Map(repositorios.map((r) => [r.name.toLowerCase(), r]));

    document.querySelectorAll('.quadro[data-repo]').forEach((quadro) => {
      const repositorio = porNome.get(quadro.dataset.repo.toLowerCase());
      if (repositorio) atualizarQuadro(quadro, repositorio);
    });
  } catch (erro) {
    console.error('Não foi possível carregar os projetos do GitHub:', erro);
  }
}

carregarPerfil();
carregarProjetos();

/* ---------- 2) Formulário ---------- */
const formulario = document.querySelector('#formulario');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

formulario.addEventListener('submit', function (event) {
  event.preventDefault();

  formulario.querySelectorAll('.erro').forEach((span) => { span.textContent = ''; });

  let valido = true;
  function falhar(campo, erro, mensagem) {
    erro.textContent = mensagem;
    if (valido) campo.focus();
    valido = false;
  }

  const nome = document.querySelector('#nome');
  if (nome.value.trim().length < 3) {
    falhar(nome, document.querySelector('#erro-nome'), 'O Nome deve ter no mínimo 3 caracteres.');
  }

  const email = document.querySelector('#email');
  if (!emailRegex.test(email.value.trim())) {
    falhar(email, document.querySelector('#erro-email'), 'Digite um e-mail válido.');
  }

  const assunto = document.querySelector('#assunto');
  if (assunto.value.trim().length < 5) {
    falhar(assunto, document.querySelector('#erro-assunto'), 'O Assunto deve ter no mínimo 5 caracteres.');
  }

  const mensagem = document.querySelector('#mensagem');
  if (mensagem.value.trim().length === 0) {
    falhar(mensagem, document.querySelector('#erro-mensagem'), 'A mensagem não pode ser vazia.');
  }

  if (valido) {
    const botao = formulario.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = 'Enviando...';
    formulario.submit();
  }
});

/* ---------- 3) Efeitos ---------- */
const quadros = [...document.querySelectorAll('.quadro')];
const hudAtual = document.querySelector('#hud-atual');
const hudBarra = document.querySelector('#hud-barra');

function atualizarHud(progresso) {
  const p = Math.min(1, Math.max(0, progresso));
  const indice = Math.round(p * (quadros.length - 1)) + 1;
  hudAtual.textContent = String(indice).padStart(2, '0');
  hudBarra.style.transform = `scaleX(${p})`;
}

// Faixa de tecnologias: duplica o conteúdo para o laço ficar contínuo
function prepararFaixa() {
  document.querySelectorAll('.faixa__trilho').forEach((trilho) => {
    const copia = document.createElement('div');
    copia.style.display = 'contents';
    copia.setAttribute('aria-hidden', 'true');
    copia.innerHTML = trilho.innerHTML;
    trilho.append(copia);
  });
}

// Carrossel nativo (celular, "menos movimento" ou sem bibliotecas): o HUD acompanha o deslize
function ligarHudNativo() {
  const trilho = document.querySelector('#trilho');
  const atualizar = () => {
    const max = trilho.scrollWidth - trilho.clientWidth;
    atualizarHud(max > 0 ? trilho.scrollLeft / max : 0);
  };
  trilho.addEventListener('scroll', atualizar, { passive: true });
  atualizar();
}

function dividirPalavras(el) {
  const palavras = el.textContent.trim().split(/\s+/);
  el.innerHTML = palavras.map((p) => `<span class="palavra">${p} </span>`).join('');
  return el.querySelectorAll('.palavra');
}

function dividirComMascara(el) {
  const palavras = el.textContent.trim().split(/\s+/);
  el.innerHTML = palavras
    .map((p) => `<span class="palavra-mascara"><span>${p}</span></span> `)
    .join('');
  return el.querySelectorAll('.palavra-mascara > span');
}

function iniciarEfeitos() {
  gsap.registerPlugin(ScrollTrigger);
  window.__animOk = true;

  /* Rolagem suave */
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((tempo) => lenis.raf(tempo * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (evento) => {
      const id = link.getAttribute('href');
      const alvo = id.length > 1 ? document.querySelector(id) : null;
      if (!alvo) return;
      evento.preventDefault();
      lenis.scrollTo(id === '#hero' ? 0 : alvo, { duration: 1.4 });
    });
  });

  /* Barra de progresso no topo */
  gsap.to('.progresso span', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0 },
  });

  /* Abertura: entrada */
  const entrada = gsap.timeline({ defaults: { ease: 'power4.out' } });
  entrada
    .from('[data-hero-linha]', { yPercent: 112, duration: 1.2, stagger: 0.12 }, 0)
    .to('[data-hero-retrato]', { autoAlpha: 1, duration: 0.01 }, 0.1)
    .from('[data-hero-retrato]', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, 0.1)
    .fromTo('[data-hero-retrato] img', { scale: 1.45 }, { scale: 1.1, duration: 1.7 }, 0.1)
    .fromTo('[data-hero-intro]', { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 0.9, stagger: 0.12 }, 0.7)
    // os adesivos "estouram" na tela um depois do outro
    .fromTo('[data-fig]', { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.09, ease: 'back.out(2.4)' }, 0.9);

  /* Abertura: saída ao rolar (o nome se abre ao meio) */
  const saida = gsap.timeline({
    defaults: { ease: 'none', duration: 1 },
    scrollTrigger: { trigger: '.hero-wrap', start: 'top top', end: () => `+=${window.innerHeight}`, scrub: 0.6 },
  });
  saida
    .to('.hero__titulo .linha:first-child', { xPercent: -22 }, 0)
    .to('.hero__titulo .linha:last-child', { xPercent: 22 }, 0)
    .to('.hero__retrato', { y: -90, scale: 0.9 }, 0)
    // cada adesivo sobe numa velocidade diferente (profundidade)
    .to('[data-fig]', { y: (_i, el) => -Number(el.dataset.v) }, 0)
    // some logo no começo da rolagem, antes de chegar perto do logo no topo
    .fromTo('[data-hero-intro]', { opacity: 1, y: 0 }, { opacity: 0, y: -50, duration: 0.35, immediateRender: false }, 0);

  /* Sobre: as palavras se acendem uma a uma */
  document.querySelectorAll('[data-palavras]').forEach((paragrafo) => {
    const palavras = dividirPalavras(paragrafo);
    gsap.fromTo(palavras, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.12, ease: 'none',
      scrollTrigger: { trigger: paragrafo, start: 'top 82%', end: 'bottom 48%', scrub: true },
    });
  });

  /* Revelações simples */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, y: 50 }, {
      autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* Título do contato: palavras sobem de dentro de uma máscara */
  const tituloContato = document.querySelector('[data-palavras-titulo]');
  if (tituloContato) {
    const palavras = dividirComMascara(tituloContato);
    gsap.from(palavras, {
      yPercent: 115, duration: 1.1, stagger: 0.07, ease: 'power4.out',
      scrollTrigger: { trigger: tituloContato, start: 'top 80%', once: true },
    });
  }

  /* Faixa de tecnologias: a velocidade acompanha a rolagem */
  prepararFaixa();
  const faixas = [...document.querySelectorAll('[data-faixa]')].map((linha) => ({
    trilho: linha.querySelector('.faixa__trilho'),
    direcao: Number(linha.dataset.faixa),
    deslocamento: 0,
    metade: 1,
  }));
  const medirFaixas = () => faixas.forEach((f) => { f.metade = f.trilho.scrollWidth / 2; });
  medirFaixas();
  window.addEventListener('resize', medirFaixas);
  gsap.ticker.add((_tempo, delta) => {
    const quadro = delta / 16.67;
    const extra = Math.min(Math.abs(lenis.velocity || 0), 40) * 0.55;
    faixas.forEach((f) => {
      f.deslocamento = (f.deslocamento + (0.7 + extra) * quadro) % f.metade;
      const x = f.direcao === 1 ? -f.deslocamento : f.deslocamento - f.metade;
      f.trilho.style.transform = `translate3d(${x}px,0,0)`;
    });
  });

  /* Projetos */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    const pin = document.querySelector('.projetos__pin');
    const trilho = document.querySelector('#trilho');
    const distancia = () => Math.max(0, trilho.scrollWidth - window.innerWidth);

    const andar = gsap.to(trilho, {
      x: () => -distancia(), ease: 'none',
      scrollTrigger: {
        trigger: pin, pin: true, start: 'top top', end: () => `+=${Math.round(distancia() * 1.6)}`,
        scrub: 0.7, invalidateOnRefresh: true,
        onUpdate: (self) => atualizarHud(self.progress),
      },
    });

    // cada card balança de um lado para o outro enquanto atravessa a tela
    quadros.forEach((quadro, i) => {
      const lado = i % 2 === 0 ? 1 : -1;
      gsap.fromTo(quadro, { rotate: 3 * lado }, {
        rotate: -3 * lado, ease: 'none',
        scrollTrigger: { trigger: quadro, containerAnimation: andar, start: 'left right', end: 'right left', scrub: true },
      });
    });

    return () => atualizarHud(0);
  });

  mm.add('(max-width: 899px)', () => {
    ligarHudNativo();
  });

  /* Cursor e botões magnéticos (só com mouse) */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cursor = document.querySelector('.cursor');
    const mudarX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const mudarY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      cursor.classList.add('is-on');
      mudarX(e.clientX);
      mudarY(e.clientY);
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
    document.querySelectorAll('a, button, input, textarea, .quadro').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });

    document.querySelectorAll('.hero .botao, .form .botao').forEach((botao) => {
      botao.addEventListener('pointermove', (e) => {
        const r = botao.getBoundingClientRect();
        gsap.to(botao, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.3 });
      });
      botao.addEventListener('pointerleave', () => {
        gsap.to(botao, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* Recalcula as posições quando fontes e imagens terminarem de carregar */
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

if (animar) {
  iniciarEfeitos();
} else {
  if (!reduzirMovimento) prepararFaixa(); // a faixa corre por CSS
  ligarHudNativo();
}
