import { MapPin, Phone, Mail } from "lucide-react";
import type { StoreInfo } from "@/types/menu";

interface LocationSectionProps {
  id?: string;
  info: StoreInfo;
}

export default function LocationSection({ id, info }: LocationSectionProps) {
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange">Visit Us</p>
      <h2 className="mt-2 max-w-xl font-serif text-3xl font-bold text-[#15181a] sm:text-4xl">
        Find us in Glasgow
      </h2>

      <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="relative aspect-[534/250] w-full overflow-hidden rounded-2xl border border-[#e9e3db]">
          {info.mapEmbedUrl ? (
            <iframe
              src={info.mapEmbedUrl}
              title="Store location map"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f5f1eb] text-sm text-[#7c848b]">
              Map unavailable
            </div>
          )}
        </div>

        <dl className="flex flex-col divide-y divide-[#e9e3db] border-y border-[#e9e3db]">
          <div className="flex items-center gap-4 py-4">
            <MapPin className="h-4 w-4 shrink-0 text-orange" aria-hidden />
            <dt className="w-16 shrink-0 text-sm font-semibold text-orange">Address</dt>
            <dd className="text-sm text-[#4a5157]">{info.address}</dd>
          </div>
          <div className="flex items-center gap-4 py-4">
            <Phone className="h-4 w-4 shrink-0 text-orange" aria-hidden />
            <dt className="w-16 shrink-0 text-sm font-semibold text-orange">Phone</dt>
            <dd className="text-sm">
              <a href={`tel:${info.phone}`} className="text-[#4a5157] underline-offset-2 hover:underline">
                {info.phone}
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-4 py-4">
            <Mail className="h-4 w-4 shrink-0 text-orange" aria-hidden />
            <dt className="w-16 shrink-0 text-sm font-semibold text-orange">Email</dt>
            <dd className="text-sm">
              <a href={`mailto:${info.email}`} className="text-[#4a5157] underline-offset-2 hover:underline">
                {info.email}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}