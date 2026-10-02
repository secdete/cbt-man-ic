<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Sertifikat Hasil Ujian CBT - {{ $student_name }}</title>
    <style>
        /* ================= Konfigurasi Halaman DomPDF ================= */
        @page {
            size: 297mm 210mm; /* A4 Landscape */
            margin: 0;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }

        body {
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            font-family: 'Helvetica', 'Arial', sans-serif;
            background-color: #F8FAFC;
            color: #0F172A;
            line-height: 1.3;
        }

        .page-container {
            width: 297mm;
            height: 210mm;
            padding: 10mm;
            background-color: #F8FAFC;
        }

        .border-outer {
            width: 100%;
            height: 100%;
            border: 3pt solid #0F172A; /* Navy Utama */
            padding: 3mm;
            background-color: #FFFFFF;
        }

        .border-inner {
            width: 100%;
            height: 100%;
            border: 1.2pt solid #D97706; /* Aksen Gold */
            padding: 7mm 12mm 5mm 12mm;
            position: relative;
            background-color: #FFFFFF;
        }

        /* Ornamen Sudut Sertifikat */
        .corner-decor {
            position: absolute;
            width: 16mm;
            height: 16mm;
        }
        .corner-tl { top: 2mm; left: 2mm; border-top: 2.5pt solid #0F172A; border-left: 2.5pt solid #0F172A; }
        .corner-tr { top: 2mm; right: 2mm; border-top: 2.5pt solid #0F172A; border-right: 2.5pt solid #0F172A; }
        .corner-bl { bottom: 2mm; left: 2mm; border-bottom: 2.5pt solid #0F172A; border-left: 2.5pt solid #0F172A; }
        .corner-br { bottom: 2mm; right: 2mm; border-bottom: 2.5pt solid #0F172A; border-right: 2.5pt solid #0F172A; }

        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
        }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }

        .institution-title {
            font-size: 10.5pt;
            font-weight: bold;
            color: #0F172A;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0;
        }

        .institution-subtitle {
            font-size: 7.5pt;
            color: #64748B;
            letter-spacing: 0.8px;
            margin: 2px 0 0 0;
        }

        .certificate-badge {
            margin-top: 5mm;
            text-align: center;
        }

        .main-heading {
            font-size: 24pt;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin: 0;
        }

        .gold-divider {
            width: 90mm;
            height: 2pt;
            background-color: #D97706;
            margin: 3px auto 6px auto;
        }

        .cert-number {
            font-size: 8.5pt;
            color: #475569;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .intro-text {
            font-size: 9.5pt;
            font-style: italic;
            color: #B45309;
            font-weight: 600;
            margin-top: 4mm;
            margin-bottom: 2mm;
        }

        .student-name {
            font-size: 21pt;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin: 1mm 0 2mm 0;
            border-bottom: 1.5pt solid #CBD5E1;
            display: inline-block;
            padding-bottom: 1mm;
            min-width: 140mm;
        }

        .exam-description {
            font-size: 9pt;
            color: #334155;
            max-width: 220mm;
            margin: 2mm auto 0 auto;
            line-height: 1.45;
        }

        .exam-title-highlight {
            font-weight: bold;
            color: #0F172A;
            text-decoration: underline;
        }

        .score-container {
            margin: 4mm auto;
            width: 175mm;
        }

        .score-card {
            background-color: #F8FAFC;
            border: 1pt solid #E2E8F0;
            border-top: 2.5pt solid #D97706;
            padding: 3mm 4mm;
            text-align: center;
        }

        .score-label {
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748B;
            letter-spacing: 1px;
        }

        .score-value {
            font-size: 15pt;
            font-weight: 800;
            color: #0F172A;
            margin-top: 1mm;
        }

        .grade-badge {
            display: inline-block;
            font-size: 8.5pt;
            font-weight: bold;
            color: #B45309;
            background-color: #FEF3C7;
            border: 0.8pt solid #FDE68A;
            padding: 1.5mm 3.5mm;
            border-radius: 3px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-top: 1mm;
        }

        .footer-table {
            margin-top: 4mm;
            width: 100%;
        }

        .signature-title {
            font-size: 8pt;
            color: #475569;
            margin-bottom: 15mm;
        }

        .signee-name {
            font-size: 9pt;
            font-weight: bold;
            color: #0F172A;
            text-decoration: underline;
            margin: 0;
        }

        .signee-nip {
            font-size: 7.5pt;
            color: #64748B;
            margin-top: 1px;
        }

        .qr-box {
            display: inline-block;
            padding: 2mm;
            background: #FFFFFF;
            border: 0.8pt solid #CBD5E1;
        }

        .qr-caption {
            font-size: 6.5pt;
            color: #64748B;
            margin-top: 1.5mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .security-bar {
            position: absolute;
            bottom: 2.5mm;
            left: 12mm;
            right: 12mm;
            border-top: 0.6pt solid #E2E8F0;
            padding-top: 1.5mm;
            font-size: 6.5pt;
            color: #94A3B8;
        }

        .hash-code {
            font-family: 'Courier', monospace;
            font-weight: bold;
            color: #475569;
        }
    </style>
</head>
<body>

<div class="page-container">
    <div class="border-outer">
        <div class="border-inner">
            
            <div class="corner-decor corner-tl"></div>
            <div class="corner-decor corner-tr"></div>
            <div class="corner-decor corner-bl"></div>
            <div class="corner-decor corner-br"></div>

            <table style="width: 100%;">
                <tr>
                    <td style="width: 15%; text-align: center; vertical-align: middle;">
                        <div style="width: 15mm; height: 15mm; border-radius: 50%; border: 1.5pt solid #D97706; background-color: #0F172A; margin: 0 auto; text-align: center;">
                            <span style="font-size: 13pt; color: #F59E0B; font-weight: bold; line-height: 14mm;">✦</span>
                        </div>
                    </td>
                    <td style="width: 70%; text-align: center; vertical-align: middle;">
                        <h3 class="institution-title">BADAN ASESMEN &amp; COMPUTER BASED TEST (CBT)</h3>
                        <p class="institution-subtitle">Sistem Evaluasi Terstandarisasi &bull; Ujian Akademik Terverifikasi Digital</p>
                    </td>
                    <td style="width: 15%; text-align: center; vertical-align: middle;">
                        <div style="width: 15mm; height: 15mm; border-radius: 50%; border: 1.5pt solid #0F172A; background-color: #FEF3C7; margin: 0 auto; text-align: center;">
                            <span style="font-size: 12pt; color: #B45309; font-weight: bold; line-height: 14mm;">★</span>
                        </div>
                    </td>
                </tr>
            </table>

            <div class="certificate-badge">
                <h1 class="main-heading">SERTIFIKAT HASIL UJIAN</h1>
                <div class="gold-divider"></div>
                <div class="cert-number">Nomor Sertifikat: <b>{{ $certificate_number }}</b></div>
            </div>

            <div class="text-center" style="margin-top: 3mm;">
                <div class="intro-text">Sertifikat ini dengan bangga diberikan kepada:</div>
                <div class="student-name">{{ $student_name }}</div>
                
                <p class="exam-description">
                    Telah mengikuti dan menyelesaikan evaluasi kompetensi berbasis komputer pada paket ujian 
                    <span class="exam-title-highlight">{{ $exam_title }}</span>, 
                    yang diselenggarakan secara serentak pada tanggal <b>{{ $exam_date }}</b> dengan capaian hasil:
                </p>
            </div>

            <div class="score-container">
                <table>
                    <tr>
                        <td style="width: 32%; padding-right: 2.5mm;">
                            <div class="score-card">
                                <div class="score-label">Skor Akhir</div>
                                <div class="score-value">{{ $final_score }} <span style="font-size: 8pt; color: #94A3B8; font-weight: normal;">/ 100</span></div>
                            </div>
                        </td>
                        <td style="width: 36%; padding: 0 2.5mm;">
                            <div class="score-card">
                                <div class="score-label">Predikat Kelulusan</div>
                                <div>
                                    <span class="grade-badge">{{ $grade }}</span>
                                </div>
                            </div>
                        </td>
                        <td style="width: 32%; padding-left: 2.5mm;">
                            <div class="score-card">
                                <div class="score-label">Status Verifikasi</div>
                                <div class="score-value" style="font-size: 10.5pt; color: #15803D; margin-top: 2.5mm;">
                                    &#10004; TERVERIFIKASI
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <table class="footer-table">
                <tr>
                    <td style="width: 32%; text-align: center; vertical-align: top;">
                        <div class="signature-title">
                            Pengawas Ujian CBT,
                        </div>
                        <div class="signee-name">{{ $proctor_name ?? 'Fahrul Rozi, S.Pd.' }}</div>
                        <div class="signee-nip">ID Pengawas: {{ $proctor_id ?? 'P-CBT-2026.041' }}</div>
                    </td>

                    <td style="width: 36%; text-align: center; vertical-align: middle;">
                        <div class="qr-box">
                            @if(isset($qr_code_base64))
                                <img src="data:image/png;base64,{{ $qr_code_base64 }}" width="62" height="62" alt="QR Code" style="display: block;">
                            @else
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=VERIFY-{{ urlencode($certificate_number) }}" width="60" height="60" alt="QR Code" style="display: block;">
                            @endif
                        </div>
                        <div class="qr-caption">Scan untuk Verifikasi Keaslian</div>
                    </td>

                    <td style="width: 32%; text-align: center; vertical-align: top;">
                        <div class="signature-title">
                            Ditetapkan di Jakarta, {{ $exam_date }}<br>
                            Kepala Lembaga Pelaksana CBT,
                        </div>
                        <div class="signee-name">{{ $headmaster_name ?? 'Dr. H. M. Zainul Muttaqin, M.Ed.' }}</div>
                        <div class="signee-nip">NIP. {{ $headmaster_nip ?? '19780514 200312 1 002' }}</div>
                    </td>
                </tr>
            </table>

            <div class="security-bar">
                <table style="width: 100%;">
                    <tr>
                        <td class="text-left" style="width: 60%;">
                            Dokumen resmi ini diterbitkan secara sah oleh Sistem CBT Cakrawala. Tanpa tanda tangan basah berdasarkan UU ITE.
                        </td>
                        <td class="text-right" style="width: 40%;">
                            Hash Verifikasi: <span class="hash-code">{{ $verification_hash ?? strtoupper(substr(sha1($certificate_number . $student_name), 0, 16)) }}</span>
                        </td>
                    </tr>
                </table>
            </div>

        </div>
    </div>
</div>

</body>
</html>
