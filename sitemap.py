import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime

# ==================== KONFIGURASI ====================
DOMAIN_UTAMA = "https://wifinyc.app"
FOLDER_DIABAIKAN = ['admin', 'config', 'includes', 'assets', 'css', 'js', '.git', '.github']
# =====================================================

def buat_sitemap_clean_url():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    root_xml = ET.Element("urlset", xmlns="http://sitemaps.org")
    today = datetime.today().strftime('%Y-%m-%d')
    jumlah_link = 0

    print("Sedang memproses file HTML menjadi Clean URL untuk GitHub Pages...")

    for root, dirs, files in os.walk(root_dir):
        # Abaikan folder sistem dan aset hiasan
        dirs[:] = [d for d in dirs if d not in FOLDER_DIABAIKAN and not d.startswith('.')]
        
        for file in files:
            if file.endswith('.html'):
                # Dapatkan jalur file relatif dari folder root
                relative_path = os.path.relpath(os.path.join(root, file), root_dir)
                
                # Ubah format Windows backslash (\) menjadi URL slash (/)
                url_path = relative_path.replace(os.sep, '/')
                
                # JIKA file adalah index.html, hapus seluruh kata 'index.html'
                if url_path.endswith('index.html'):
                    url_path = url_path.replace('index.html', '')
                # JIKA file html biasa, hapus ekstensi '.html' untuk membuat Clean URL
                else:
                    url_path = url_path.replace('.html', '')

                # Gabungkan dengan domain utama dan rapikan garis miring di ujung
                url_penuh = f"{DOMAIN_UTAMA}/{url_path}".rstrip('/')
                if url_penuh == DOMAIN_UTAMA:
                    url_penuh = f"{DOMAIN_UTAMA}/"

                # Buat elemen struktur XML sitemap
                url_tag = ET.SubElement(root_xml, "url")
                loc = ET.SubElement(url_tag, "loc")
                loc.text = url_penuh
                
                lastmod = ET.SubElement(url_tag, "lastmod")
                lastmod.text = today
                
                changefreq = ET.SubElement(url_tag, "changefreq")
                changefreq.text = "weekly"
                
                priority = ET.SubElement(url_tag, "priority")
                priority.text = "1.0" if url_penuh == f"{DOMAIN_UTAMA}/" else "0.8"
                
                jumlah_link += 1

    # Merapikan tampilan kode XML agar indah dan standar
    xml_mentah = ET.tostring(root_xml, 'utf-8')
    xml_rapi = minidom.parseString(xml_mentah).toprettyxml(indent="  ")
    
    # Simpan file langsung di laptop Anda
    output_file = os.path.join(root_dir, "sitemap.xml")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(xml_rapi)
        
    print(f"\n[SUKSES] File 'sitemap.xml' versi Clean URL (Tanpa .html) berhasil dibuat!")
    print(f"Total ribuan halaman yang berhasil dicatat: {jumlah_link} link.")
    print("Silakan lakukan push/commit ke GitHub agar sitemap ini aktif secara live.")

if __name__ == "__main__":
    buat_sitemap_clean_url()
