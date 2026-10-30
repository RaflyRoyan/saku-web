import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import { onSessionExpired } from "../lib/session";

/** 401 di mana pun → bersihkan cache, ke /login, toast "Sesi berakhir…". */
export default function SessionWatcher() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(
    () =>
      onSessionExpired(() => {
        qc.clear();
        navigate("/login", { replace: true });
        toast.show("Sesi berakhir, silakan login ulang.", "peringatan");
      }),
    [qc, navigate, toast],
  );

  return null;
}
