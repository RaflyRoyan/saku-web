import { useParams } from "react-router-dom";

export default function TransaksiFormPage() {
  const { id } = useParams();
  return <h1 className="text-xl font-bold">{id ? "Ubah Transaksi" : "Catat Transaksi"}</h1>;
}
