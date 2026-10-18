import { useEffect, useState } from 'react';

type Estado = 'verificando' | 'ok' | 'erro';

function useSaude() {
  const [servidor, setServidor] = useState<Estado>('verificando');
  const [banco, setBanco] = useState<Estado>('verificando');

  useEffect(() => {
    fetch('/health')
      .then(async (resposta) => {
        const corpo = (await resposta.json()) as { banco?: string };
        setServidor('ok');
        setBanco(corpo.banco === 'ok' ? 'ok' : 'erro');
      })
      .catch(() => {
        setServidor('erro');
        setBanco('erro');
      });
  }, []);

  return { servidor, banco };
}

const ROTULO: Record<Estado, string> = { verificando: 'verificando…', ok: 'ok', erro: 'fora do ar' };

export function App() {
  const { servidor, banco } = useSaude();

  return (
    <div className="inicio">
      <section className="inicio-placa" aria-labelledby="titulo">
        <a className="marca" href="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="6.5" />
            <path d="M12 1.5v21M1.5 12h21" />
          </svg>
          Grafema
        </a>
        <h1 id="titulo">Desenhe letras. Invente alfabetos.</h1>
        <p className="lede">
          Modifique uma fonte aberta em Latino, Grego ou Cirílico, ou crie um alfabeto novo e digite com ele no
          teclado. Tudo no navegador.
        </p>
      </section>

      <aside className="inicio-lado" aria-label="Estado do sistema">
        <p className="etiqueta">Em construção</p>
        <p className="aviso">Criar conta e entrar chegam em breve.</p>
        <dl className="saude">
          <div>
            <dt>Servidor</dt>
            <dd className={`mono ${servidor}`}>{ROTULO[servidor]}</dd>
          </div>
          <div>
            <dt>Banco de dados</dt>
            <dd className={`mono ${banco}`}>{ROTULO[banco]}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
