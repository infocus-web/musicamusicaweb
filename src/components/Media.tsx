export function Media({ url, tipo }: { url: string; tipo: string | null }) {
  if (tipo === "video") {
    return <video src={url} controls playsInline preload="metadata" className="w-full max-h-[480px] rounded-xl bg-black" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Avance del trabajo" className="w-full max-h-[480px] rounded-xl object-contain bg-black/5" />;
}
