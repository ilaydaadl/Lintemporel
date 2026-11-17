"use client";

import { useEffect, useRef, useState } from "react";
import { SHIPPING } from "@/lib/config";
import type { Relay } from "@/lib/types";

// Carte officielle (gratuite) de Mondial Relay : la cliente tape son code postal,
// voit les points relais proches et clique sur le sien.
const JQUERY = "https://code.jquery.com/jquery-3.7.1.min.js";
const WIDGET =
  "https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js";

type MRShop = {
  ID: string;
  Nom: string;
  Adresse1: string;
  Adresse2: string;
  CP: string;
  Ville: string;
  Pays: string;
};

type JQueryLike = (el: HTMLElement) => {
  MR_ParcelShopPicker: (options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    jQuery?: JQueryLike;
    __mrLoader?: Promise<void>;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Échec du chargement : ${src}`));
    document.head.appendChild(s);
  });
}

function loadWidget() {
  window.__mrLoader ??= (async () => {
    if (!window.jQuery) await loadScript(JQUERY);
    await loadScript(WIDGET);
  })();
  return window.__mrLoader;
}

export function RelayPicker({
  onSelect,
}: {
  onSelect: (relay: Relay | null) => void;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const callback = useRef(onSelect);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (started.current || !zone.current) return;
    started.current = true;
    const el = zone.current;
    loadWidget()
      .then(() => {
        window.jQuery!(el).MR_ParcelShopPicker({
          Brand: SHIPPING.mondialRelayBrand,
          Country: "FR",
          AllowedCountries: SHIPPING.methods.relay.countries.join(","),
          ColLivMod: "24R",
          NbResults: "7",
          Responsive: true,
          ShowResultsOnMap: true,
          OnParcelShopSelected: (shop: MRShop) => {
            callback.current(
              shop?.ID
                ? {
                    id: shop.ID,
                    name: shop.Nom?.trim() ?? "",
                    address: [shop.Adresse1, shop.Adresse2]
                      .map((x) => x?.trim())
                      .filter(Boolean)
                      .join(", "),
                    postcode: shop.CP?.trim() ?? "",
                    city: shop.Ville?.trim() ?? "",
                    country: shop.Pays?.trim() ?? "FR",
                  }
                : null,
            );
          },
        });
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <p className="text-sm text-red-800">
        La carte des points relais n&apos;a pas pu se charger. Vérifiez votre
        connexion puis rechargez la page, ou choisissez la livraison à domicile.
      </p>
    );
  }

  return (
    <div className="mr-widget overflow-hidden border border-line bg-white">
      <div ref={zone} />
    </div>
  );
}
