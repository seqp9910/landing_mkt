interface ResultScreenProps {
  calificado: boolean;
}

export default function ResultScreen({ calificado }: ResultScreenProps) {
  return (
    <div className="flex flex-col gap-4 text-center">
      {calificado ? (
        <>
          <h2 className="text-white text-2xl font-semibold leading-snug">¡Ya casi terminamos!</h2>
          <p className="text-white/80 text-base leading-relaxed">
            Revisa tu WhatsApp. Muy pronto recibirás toda la información para iniciar tu proceso de defensa de tus derechos laborales.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-white text-2xl font-semibold leading-snug">Gracias por tu interés.</h2>
          <p className="text-white/80 text-base leading-relaxed">
            Por ahora no cumples con el perfil para este proceso, pero te avisaremos si eso cambia.
          </p>
        </>
      )}
    </div>
  );
}
