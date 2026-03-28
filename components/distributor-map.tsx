"use client";

import { MapContainer, Marker, Popup, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Distributor } from "@/types";

function stockColor(stock: number) {
  if (stock >= 55) return "#22c55e";
  if (stock >= 30) return "#f59e0b";
  return "#ef4444";
}

export function DistributorMap({ distributors }: { distributors: Distributor[] }) {
  return (
    <div className="relative z-0 overflow-hidden rounded-xl border border-slate-800">
      <MapContainer
        center={[19.5, 75.7]}
        zoom={6}
        scrollWheelZoom={false}
        className="h-[250px] w-full md:h-[320px] lg:h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {distributors.map((item) => (
          <CircleMarker
            key={item.id}
            center={[item.lat, item.lng]}
            radius={12}
            pathOptions={{ color: stockColor(item.stock), fillColor: stockColor(item.stock), fillOpacity: 0.6 }}
          >
            <Popup>
              <strong>{item.name}</strong>
              <br />
              Stock: {item.stock}
              <br />
              {item.district}
            </Popup>
          </CircleMarker>
        ))}
        <Marker position={[19.5, 75.7]}>
          <Popup>Maharashtra distribution area</Popup>
        </Marker>
      </MapContainer>

      <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg border border-slate-700 bg-slate-950/85 px-3 py-2 text-xs text-slate-200">
        <p className="mb-1 font-medium text-slate-300">Delivery Status</p>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span>Delivered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span>Failed</span>
        </div>
      </div>
    </div>
  );
}
