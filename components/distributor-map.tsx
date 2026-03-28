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
    <MapContainer
      center={[19.5, 75.7]}
      zoom={6}
      scrollWheelZoom={false}
      className="h-[340px] w-full rounded-xl"
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
  );
}
