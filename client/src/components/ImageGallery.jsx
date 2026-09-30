import { useRef, useState } from 'react';

/**
 * Desktop: vertical thumbnails + main image. Mobile: swipeable snap carousel with a
 * "1 / 4" counter. Supports 1-4 images; the first image is the default.
 */
export default function ImageGallery({ images, alt }) {
  const [active, setActive] = useState(0);
  const scroller = useRef(null);
  const count = images.length;

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i) => {
    setActive(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="md:flex md:gap-4">
      {/* thumbnails (md+) */}
      {count > 1 && (
        <ul className="hidden shrink-0 flex-col gap-3 md:flex" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.url + i}>
              <button type="button" onClick={() => goTo(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active}
                className={`grid h-[84px] w-[76px] place-items-center overflow-hidden rounded border bg-mist ${i === active ? 'border-navy ring-1 ring-navy' : 'border-line hover:border-navy/50'}`}>
                <img src={img.url} alt="" className="h-full w-full object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* main image (md+) */}
      <div className="hidden aspect-[9/10] flex-1 place-items-center overflow-hidden rounded border border-line bg-mist md:grid">
        <img src={images[active]?.url} alt={alt} className="h-full w-full object-contain p-6" />
      </div>

      {/* carousel (mobile) */}
      <div className="relative md:hidden">
        <div ref={scroller} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded border border-line bg-mist" aria-roledescription="carousel" aria-label={`${alt} images`}>
          {images.map((img, i) => (
            <div key={img.url + i} className="grid aspect-square min-w-full snap-center place-items-center" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
              <img src={img.url} alt={i === 0 ? alt : `${alt} - image ${i + 1}`} className="h-full w-full object-contain p-5" loading={i === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <span className="absolute right-3 top-3 rounded-full bg-navy/85 px-2.5 py-1 text-xs font-medium text-white" aria-live="polite">{active + 1} / {count}</span>
            <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Choose image">
              {images.map((_, i) => (
                <button key={i} type="button" role="tab" aria-selected={i === active} aria-label={`Image ${i + 1}`} onClick={() => goTo(i)} className={`h-2 rounded-full transition-all ${i === active ? 'w-5 bg-navy' : 'w-2 bg-slate-300'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
