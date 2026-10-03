// Penanda tangan sertifikat. Satu sumber untuk tampilan di layar (modal
// sertifikat) dan PDF sertifikat supaya keduanya tidak pernah berbeda.
export const CERTIFICATE_SIGNATORIES = {
  proctor: {
    role: "Pengawas Ujian CBT,",
    name: "Naufal Luthfi S.Kom",
    meta: "ID: P-CBT-2026.041",
  },
  headmaster: {
    role: "Kepala Lembaga Pelaksana CBT,",
    name: "Citarani Anggraeni, S.Pd., M.Pd",
    meta: "NIP. 19780514 200312 1 002",
  },
} as const;
