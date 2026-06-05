import os
import re
import shutil

src_components = '/Users/shawket/Downloads/sufrix-portfolio/src/components'
src_sections = '/Users/shawket/Downloads/sufrix-portfolio/src/pages'

dst_components = 'src/pages/landing/components'
dst_sections = 'src/pages/landing/sections'

os.makedirs(dst_components, exist_ok=True)
os.makedirs(dst_sections, exist_ok=True)

def process_file(src, dst):
    with open(src, 'r', encoding='utf-8') as f:
        content = f.read()

    # Rewrite component imports
    content = content.replace('@/components/', '@/pages/landing/components/')
    
    # Strip presentation snapshot/page logic
    # We want natural vertical scrolling, so Page.tsx should just be a section.
    if src.endswith('Page.tsx'):
        # Remove snap-start, h-[calc(100svh)], w-[calc(100svh*16/9)] 
        # replace with min-h-screen w-full relative overflow-hidden py-16
        content = re.sub(r'className="page[^"]*"', 'className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center py-20 px-4 md:px-8 bg-cream"', content)
        content = re.sub(r'style=\{\{[^\}]*\}\}', '', content)
    
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(content)

# Copy components
for f in os.listdir(src_components):
    if f.endswith('.tsx') or f.endswith('.ts'):
        process_file(os.path.join(src_components, f), os.path.join(dst_components, f))

# Copy sections
for f in os.listdir(src_sections):
    if f.endswith('.tsx'):
        # Skip pricing if they don't want it, but let's copy it anyway and just not import it
        process_file(os.path.join(src_sections, f), os.path.join(dst_sections, f))

print("Copied components and sections successfully.")
