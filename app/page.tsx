"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (isStandalone) return null; // já instalado, não mostra nada

  return (
    <div className='rounded-lg border p-3 text-sm'>
      {isIOS ? (
        <p>
          Toque em <strong>Compartilhar ⎋</strong> e depois em{" "}
          <strong>{"Adicionar à Tela de Início"}</strong> para instalar o app.
        </p>
      ) : (
        <p>
          Instale o CondoSimples: procure {"Instalar app"} no menu do navegador.
        </p>
      )}
    </div>
  );
}
