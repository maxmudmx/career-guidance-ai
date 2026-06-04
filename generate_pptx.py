# -*- coding: utf-8 -*-
"""Kasbim — Diplom Prezentatsiyasi 2026 (yangi versiya).

Yorug' fon · katta shrift · mavzuga oid rasmlar · 10 slayd.
matplotlib bilan haqiqiy diagrammalar generatsiya qilinadi va pptx'ga joylanadi.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, RegularPolygon, FancyArrowPatch
import matplotlib.patheffects as path_effects
import numpy as np

ASSETS = 'slide_assets'
os.makedirs(ASSETS, exist_ok=True)

# ── Brand palette (matplotlib hex) ────────────────────────
HX_BG       = '#FAFAF7'
HX_NAVY     = '#1E3A5F'
HX_EMERALD  = '#0F766E'
HX_AMBER    = '#D97706'
HX_GOLD     = '#CA8A04'
HX_CHARCOAL = '#1F2937'
HX_SLATE    = '#64748B'
HX_BORDER   = '#E5E7EB'
HX_WHITE    = '#FFFFFF'

# ── python-pptx RGB ───────────────────────────────────────
BG       = RGBColor(0xFA, 0xFA, 0xF7)
NAVY     = RGBColor(0x1E, 0x3A, 0x5F)
EMERALD  = RGBColor(0x0F, 0x76, 0x6E)
AMBER    = RGBColor(0xD9, 0x77, 0x06)
GOLD     = RGBColor(0xCA, 0x8A, 0x04)
CHARCOAL = RGBColor(0x1F, 0x29, 0x37)
SLATE    = RGBColor(0x64, 0x74, 0x8B)
SLATE_S  = RGBColor(0x94, 0xA3, 0xB8)
BORDER   = RGBColor(0xE5, 0xE7, 0xEB)
WHITE    = RGBColor(0xFF, 0xFF, 0xFF)
SOFT_BG  = RGBColor(0xFB, 0xFB, 0xF8)
NAVY_SOFT    = RGBColor(0xE8, 0xEC, 0xF1)
EMERALD_SOFT = RGBColor(0xE3, 0xF1, 0xEF)
AMBER_SOFT   = RGBColor(0xFA, 0xEB, 0xD8)
GOLD_SOFT    = RGBColor(0xFD, 0xF4, 0xD9)

# ═════════════════════════════════════════════════════════
# IMAGE GENERATORS (matplotlib)
# ═════════════════════════════════════════════════════════

def make_problem_chart():
    """Slayd 2 — Muammo: yoshlar ishsizlik + pushaymonlik visualizatsiyasi."""
    fig, ax = plt.subplots(figsize=(10, 4.2), facecolor=HX_BG)
    ax.set_facecolor(HX_BG)

    # Data: yillar va pushaymonlik foizi (illustrative)
    years = np.arange(2010, 2025)
    regret = np.array([45, 47, 48, 51, 53, 55, 58, 60, 61, 62, 63, 64, 64, 65, 65])
    unemp  = np.array([12.8, 12.5, 12.7, 12.9, 13.1, 13.2, 13.3, 13.4, 13.5, 13.5, 13.7, 13.8, 13.7, 13.6, 13.6])

    ax.fill_between(years, regret, alpha=0.18, color=HX_NAVY)
    ax.plot(years, regret, color=HX_NAVY, linewidth=3, marker='o', markersize=6,
            label='Tanlagan kasbidan pushaymon (%)')

    ax2 = ax.twinx()
    ax2.plot(years, unemp, color=HX_AMBER, linewidth=2.5, linestyle='--', marker='s',
             markersize=5, label='Yoshlar ishsizligi (%)')
    ax2.set_ylim(10, 16)
    ax2.set_ylabel('Ishsizlik %', color=HX_AMBER, fontsize=11)
    ax2.tick_params(axis='y', colors=HX_AMBER, labelsize=10)
    ax2.spines['top'].set_visible(False)

    ax.set_xlim(2010, 2024)
    ax.set_ylim(40, 70)
    ax.set_ylabel('Pushaymonlik %', color=HX_NAVY, fontsize=11)
    ax.tick_params(axis='y', colors=HX_NAVY, labelsize=10)
    ax.tick_params(axis='x', colors=HX_SLATE, labelsize=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_color(HX_BORDER)
    ax.spines['left'].set_color(HX_BORDER)
    ax.grid(True, alpha=0.3, linewidth=0.5, color=HX_BORDER)

    # legend combined
    lines1, labels1 = ax.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax.legend(lines1+lines2, labels1+labels2, loc='lower right',
              frameon=False, fontsize=10, labelcolor=HX_CHARCOAL)

    ax.set_title("15 yil ichida pushaymonlik 45% → 65% gacha o'sgan",
                 fontsize=13, color=HX_NAVY, weight='bold',
                 loc='left', pad=14)

    plt.tight_layout()
    path = os.path.join(ASSETS, 'chart_problem.png')
    plt.savefig(path, dpi=200, facecolor=HX_BG, bbox_inches='tight')
    plt.close()
    return path


def make_results_chart():
    """Slayd 7 — Natijalar: 6 modelni horizontal bar chart."""
    fig, ax = plt.subplots(figsize=(10.5, 5.2), facecolor=HX_BG)
    ax.set_facecolor(HX_BG)

    models = ['Random\nbaseline', 'Popularity\nbaseline', 'CF-NMF', 'CF-SVD',
              'Content-Based', 'Hybrid (α=1.0)']
    values = [1.65, 1.65, 20.46, 47.52, 88.45, 88.45]
    is_win = [False, False, False, False, True, True]

    colors = [HX_EMERALD if w else HX_SLATE for w in is_win]
    bars = ax.barh(models, values, color=colors, height=0.65, edgecolor='white', linewidth=1.5)

    # highlight winning bars with subtle outline
    for bar, win in zip(bars, is_win):
        if win:
            bar.set_edgecolor(HX_GOLD)
            bar.set_linewidth(2)

    # annotate values at bar end
    for bar, val, win in zip(bars, values, is_win):
        c = HX_EMERALD if win else HX_CHARCOAL
        weight = 'bold' if win else 'normal'
        ax.text(val + 1.5, bar.get_y() + bar.get_height()/2,
                f'{val:.2f}%', va='center', ha='left',
                fontsize=13, color=c, weight=weight,
                family='Consolas')

    ax.set_xlim(0, 100)
    ax.set_xlabel('Precision@5  (5 tavsiyadan to\'g\'ri chiqqani)',
                  fontsize=11, color=HX_CHARCOAL)
    ax.tick_params(axis='y', labelsize=12, colors=HX_CHARCOAL)
    ax.tick_params(axis='x', labelsize=10, colors=HX_SLATE)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_color(HX_BORDER)
    ax.spines['left'].set_color(HX_BORDER)
    ax.grid(True, axis='x', alpha=0.35, linewidth=0.5, color=HX_BORDER)
    ax.set_axisbelow(True)

    # Highlight zone
    ax.axvspan(80, 100, alpha=0.08, color=HX_EMERALD)
    ax.text(90, -0.7, 'YUQORI DARAJA', fontsize=9, color=HX_EMERALD,
            ha='center', weight='bold', family='Consolas', alpha=0.7)

    plt.tight_layout()
    path = os.path.join(ASSETS, 'chart_results.png')
    plt.savefig(path, dpi=200, facecolor=HX_BG, bbox_inches='tight')
    plt.close()
    return path


def make_riasec_hexagon():
    """Slayd 6 — RIASEC olti burchakli diagramma."""
    fig, ax = plt.subplots(figsize=(6.5, 6.5), facecolor=HX_BG)
    ax.set_facecolor(HX_BG)
    ax.set_xlim(-1.4, 1.4); ax.set_ylim(-1.4, 1.4)
    ax.set_aspect('equal'); ax.axis('off')

    # Hexagon vertices (R top, going clockwise)
    labels = ['R', 'I', 'A', 'S', 'E', 'C']
    names = ['Realistik', 'Tadqiqotchi', 'Ijodkor', 'Ijtimoiy', 'Tadbirkor', 'Konvensional']
    colors = [HX_NAVY, HX_AMBER, HX_EMERALD, HX_GOLD, HX_NAVY, HX_EMERALD]

    angles = np.linspace(np.pi/2, np.pi/2 + 2*np.pi, 7)[:-1]  # 6 corners
    xs = np.cos(angles); ys = np.sin(angles)

    # Outer hexagon (light)
    hex_outer = plt.Polygon(list(zip(xs, ys)), closed=True, fill=False,
                            edgecolor=HX_BORDER, linewidth=1.5)
    ax.add_patch(hex_outer)
    # Inner hexagon (lighter)
    hex_inner = plt.Polygon(list(zip(xs*0.65, ys*0.65)), closed=True, fill=False,
                            edgecolor=HX_BORDER, linewidth=1, linestyle='--', alpha=0.5)
    ax.add_patch(hex_inner)

    # Sample profile polygon (example user)
    sample = [0.9, 0.6, 0.85, 0.75, 0.5, 0.7]
    sx = np.cos(angles) * sample
    sy = np.sin(angles) * sample
    profile = plt.Polygon(list(zip(sx, sy)), closed=True,
                          facecolor=HX_EMERALD, alpha=0.25,
                          edgecolor=HX_EMERALD, linewidth=2.5)
    ax.add_patch(profile)
    # profile dots
    ax.scatter(sx, sy, c=HX_EMERALD, s=60, zorder=5, edgecolor='white', linewidth=1.5)

    # Corner circles with letters
    for x, y, lbl, color in zip(xs, ys, labels, colors):
        circle = Circle((x*1.18, y*1.18), 0.13, facecolor='white',
                        edgecolor=color, linewidth=3, zorder=3)
        ax.add_patch(circle)
        ax.text(x*1.18, y*1.18, lbl, ha='center', va='center',
                fontsize=16, weight='bold', color=color,
                family='Segoe UI', zorder=4)

    # center label
    ax.text(0, 0, 'sample profile', ha='center', va='center',
            fontsize=9, color=HX_SLATE, family='Consolas',
            style='italic', alpha=0.7)

    plt.tight_layout()
    path = os.path.join(ASSETS, 'riasec_hexagon.png')
    plt.savefig(path, dpi=200, facecolor=HX_BG, bbox_inches='tight', pad_inches=0.1)
    plt.close()
    return path


def make_vector_diagram():
    """Slayd 5 — Cosine similarity vector visualizatsiyasi."""
    fig, ax = plt.subplots(figsize=(8.5, 5.5), facecolor=HX_WHITE)
    ax.set_facecolor(HX_WHITE)
    ax.set_xlim(-0.3, 5); ax.set_ylim(-0.3, 4)
    ax.set_aspect('equal'); ax.axis('off')

    # subtle grid
    for x in range(0, 6):
        ax.axvline(x, color=HX_BORDER, linewidth=0.3, alpha=0.6, zorder=1)
    for y in range(0, 5):
        ax.axhline(y, color=HX_BORDER, linewidth=0.3, alpha=0.6, zorder=1)

    # Axes
    ax.annotate('', xy=(4.8, 0), xytext=(0, 0),
                arrowprops=dict(arrowstyle='->', color=HX_SLATE, lw=1.2))
    ax.annotate('', xy=(0, 3.7), xytext=(0, 0),
                arrowprops=dict(arrowstyle='->', color=HX_SLATE, lw=1.2))

    # User vector (navy)
    u_end = (3.2, 3.3)
    ax.annotate('', xy=u_end, xytext=(0, 0),
                arrowprops=dict(arrowstyle='->', color=HX_NAVY, lw=4))
    ax.text(u_end[0]+0.1, u_end[1]+0.1, 'u — user',
            fontsize=15, weight='bold', color=HX_NAVY, family='Segoe UI')

    # Career vector (emerald)
    c_end = (4.2, 2.5)
    ax.annotate('', xy=c_end, xytext=(0, 0),
                arrowprops=dict(arrowstyle='->', color=HX_EMERALD, lw=4))
    ax.text(c_end[0]+0.05, c_end[1]-0.25, 'c — career',
            fontsize=15, weight='bold', color=HX_EMERALD, family='Segoe UI')

    # Angle arc
    import matplotlib.patches as mp
    arc = mp.Arc((0, 0), 1.6, 1.6, angle=0,
                 theta1=np.degrees(np.arctan2(c_end[1], c_end[0])),
                 theta2=np.degrees(np.arctan2(u_end[1], u_end[0])),
                 linewidth=2.5, color=HX_AMBER)
    ax.add_patch(arc)
    ax.text(1.1, 0.7, r'$\theta$', fontsize=26, color=HX_AMBER,
            weight='bold', style='italic', family='serif')

    # Annotation: small angle = high similarity
    ax.text(2.5, 0.2, 'kichik burchak  →  yuqori o\'xshashlik',
            fontsize=11, color=HX_SLATE, family='Consolas',
            style='italic', ha='center')

    plt.tight_layout()
    path = os.path.join(ASSETS, 'vector_diagram.png')
    plt.savefig(path, dpi=200, facecolor=HX_WHITE, bbox_inches='tight', pad_inches=0.1)
    plt.close()
    return path


def make_pipeline_diagram():
    """Slayd 8 — Eksperimental pipeline diagrammasi."""
    fig, ax = plt.subplots(figsize=(11, 3.0), facecolor=HX_BG)
    ax.set_facecolor(HX_BG)
    ax.set_xlim(0, 10); ax.set_ylim(0, 3)
    ax.axis('off')

    stages = [
        ('1500\nfoydalanuvchi', HX_NAVY, 'data'),
        ('60 / 20 / 20\nsplit', HX_EMERALD, 'split'),
        ('6 ta model\no\'qitish', HX_AMBER, 'train'),
        ('Metrikalar\nbo\'yicha baholash', HX_GOLD, 'eval'),
    ]
    n = len(stages)
    box_w = 1.7; box_h = 1.7; gap = (10 - n*box_w) / (n+1)
    cy = 1.5

    for i, (label, color, _) in enumerate(stages):
        cx = gap + i*(box_w + gap) + box_w/2
        # rounded box
        bbox = FancyBboxPatch((cx - box_w/2, cy - box_h/2), box_w, box_h,
                              boxstyle="round,pad=0.05,rounding_size=0.12",
                              facecolor=HX_WHITE, edgecolor=color, linewidth=2.5)
        ax.add_patch(bbox)
        # top accent
        ax.add_patch(plt.Rectangle((cx - box_w/2, cy + box_h/2 - 0.12),
                                    box_w, 0.12, facecolor=color, zorder=2))
        ax.text(cx, cy - 0.05, label, ha='center', va='center',
                fontsize=12, weight='bold', color=HX_NAVY,
                family='Segoe UI', linespacing=1.4)
        # step number
        ax.text(cx, cy + box_h/2 + 0.2, f'STEP  {i+1}',
                ha='center', fontsize=9, weight='bold',
                color=HX_SLATE, family='Consolas')

        # arrow to next
        if i < n - 1:
            next_cx = gap + (i+1)*(box_w + gap) + box_w/2
            ax.annotate('', xy=(next_cx - box_w/2 - 0.05, cy),
                        xytext=(cx + box_w/2 + 0.05, cy),
                        arrowprops=dict(arrowstyle='->', color=HX_AMBER,
                                        lw=2.5, mutation_scale=22))

    plt.tight_layout()
    path = os.path.join(ASSETS, 'pipeline.png')
    plt.savefig(path, dpi=200, facecolor=HX_BG, bbox_inches='tight', pad_inches=0.1)
    plt.close()
    return path


def make_brain_icon():
    """Slayd 3 — kichik AI brain icon (yechim slaydida)."""
    fig, ax = plt.subplots(figsize=(3, 3), facecolor='none')
    ax.set_facecolor('none')
    ax.set_xlim(-1.5, 1.5); ax.set_ylim(-1.5, 1.5)
    ax.set_aspect('equal'); ax.axis('off')

    # 8 nodes around in network
    np.random.seed(1)
    nodes = [(-0.7, 0.4, HX_EMERALD), (0.6, 0.5, HX_AMBER),
             (-0.5, -0.5, HX_GOLD), (0.7, -0.3, HX_EMERALD),
             (0, 0.8, HX_NAVY), (-0.9, -0.1, HX_AMBER),
             (0.9, 0.1, HX_GOLD), (0, -0.9, HX_NAVY)]
    # connections (semi-random)
    conns = [(0,1),(0,2),(0,4),(0,5),(1,4),(1,6),(2,5),(2,7),
             (3,1),(3,6),(3,7),(4,1),(5,2),(6,3)]
    for i, j in conns:
        ax.plot([nodes[i][0], nodes[j][0]], [nodes[i][1], nodes[j][1]],
                color=HX_WHITE, alpha=0.35, linewidth=1, zorder=1)
    for x, y, c in nodes:
        ax.scatter(x, y, c=c, s=180, zorder=2, edgecolor='white', linewidth=1.5)

    plt.tight_layout()
    path = os.path.join(ASSETS, 'brain.png')
    plt.savefig(path, dpi=200, facecolor='none', bbox_inches='tight',
                transparent=True, pad_inches=0)
    plt.close()
    return path


print("Generating images...")
img_problem  = make_problem_chart()
img_results  = make_results_chart()
img_riasec   = make_riasec_hexagon()
img_vector   = make_vector_diagram()
img_pipeline = make_pipeline_diagram()
img_brain    = make_brain_icon()
print("Images ready.\n")


# ═════════════════════════════════════════════════════════
# PPTX GENERATION
# ═════════════════════════════════════════════════════════

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SW = prs.slide_width
SH = prs.slide_height
BLANK = prs.slide_layouts[6]

# Font (use Segoe UI as universally available on Windows)
FONT  = 'Segoe UI'
FONTH = 'Segoe UI Semibold'
MONO  = 'Consolas'
SERIF = 'Georgia'


# ── Helpers ───────────────────────────────────────────────
def set_bg(slide, color):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color


def add_rect(slide, x, y, w, h, fill=None, line=None, line_w=0.75):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.shadow.inherit = False
    if fill is None: shp.fill.background()
    else:
        shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line is None: shp.line.fill.background()
    else:
        shp.line.color.rgb = line; shp.line.width = Pt(line_w)
    return shp


def add_rounded(slide, x, y, w, h, fill=None, line=None, radius=0.05, line_w=0.75):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    shp.shadow.inherit = False
    shp.adjustments[0] = radius
    if fill is None: shp.fill.background()
    else:
        shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line is None: shp.line.fill.background()
    else:
        shp.line.color.rgb = line; shp.line.width = Pt(line_w)
    return shp


def add_text(slide, x, y, w, h, text, *, size=18, color=CHARCOAL,
             bold=False, italic=False, font=None, align='left',
             anchor='top', spacing=1.2, letter_spacing=0):
    if font is None: font = FONT
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    for attr in ('margin_left','margin_right','margin_top','margin_bottom'):
        setattr(tf, attr, Emu(0))
    tf.word_wrap = True
    tf.vertical_anchor = {'top':MSO_ANCHOR.TOP, 'middle':MSO_ANCHOR.MIDDLE,
                          'bottom':MSO_ANCHOR.BOTTOM}.get(anchor, MSO_ANCHOR.TOP)
    lines = text.split('\n') if isinstance(text, str) else [text]
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = {'left':PP_ALIGN.LEFT, 'center':PP_ALIGN.CENTER,
                       'right':PP_ALIGN.RIGHT}.get(align, PP_ALIGN.LEFT)
        p.line_spacing = spacing
        run = p.add_run()
        run.text = line
        run.font.name = font
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color
        if letter_spacing:
            rPr = run._r.get_or_add_rPr()
            rPr.set('spc', str(letter_spacing))
    return box


def add_runs(slide, x, y, w, h, runs, *, align='left', anchor='top', spacing=1.3):
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    for attr in ('margin_left','margin_right','margin_top','margin_bottom'):
        setattr(tf, attr, Emu(0))
    tf.word_wrap = True
    tf.vertical_anchor = {'top':MSO_ANCHOR.TOP, 'middle':MSO_ANCHOR.MIDDLE,
                          'bottom':MSO_ANCHOR.BOTTOM}.get(anchor, MSO_ANCHOR.TOP)
    p = tf.paragraphs[0]
    p.alignment = {'left':PP_ALIGN.LEFT, 'center':PP_ALIGN.CENTER,
                   'right':PP_ALIGN.RIGHT}.get(align, PP_ALIGN.LEFT)
    p.line_spacing = spacing
    for txt, opts in runs:
        r = p.add_run(); r.text = txt
        r.font.name  = opts.get('font', FONT)
        r.font.size  = Pt(opts.get('size', 18))
        r.font.bold  = opts.get('bold', False)
        r.font.italic = opts.get('italic', False)
        r.font.color.rgb = opts.get('color', CHARCOAL)
    return box


def add_top_bar(slide):
    seg = SW / 3
    add_rect(slide, Emu(0), Emu(0), seg, Inches(0.08), fill=NAVY)
    add_rect(slide, seg, Emu(0), seg, Inches(0.08), fill=EMERALD)
    add_rect(slide, 2*seg, Emu(0), seg, Inches(0.08), fill=AMBER)


def add_footer(slide, num, total=10):
    add_runs(slide, Inches(0.5), Inches(7.1), Inches(5), Inches(0.3),
             [('Kasbim', {'size':11, 'color':NAVY, 'bold':True}),
              ('  ·  Diplom 2026', {'size':11, 'color':SLATE})],
             align='left', anchor='middle')
    add_text(slide, Inches(11.0), Inches(7.1), Inches(1.83), Inches(0.3),
             f"{num:02d} / {total:02d}", size=11, color=SLATE,
             font=MONO, align='right', anchor='middle',
             letter_spacing=100)


def add_eyebrow(slide, x, y, text, color=SLATE):
    return add_text(slide, x, y, Inches(8), Inches(0.35), text,
                    size=12, color=color, font=MONO,
                    bold=True, letter_spacing=400)


def add_title(slide, x, y, text, size=52, color=NAVY):
    return add_text(slide, x, y, Inches(12), Inches(1.4), text,
                    size=size, color=color, bold=True, font=FONT, spacing=1.05)


def add_stat_card(slide, x, y, w, h, big, label, accent, source=None,
                  big_size=56):
    add_rounded(slide, x, y, w, h, fill=WHITE, line=BORDER, radius=0.05, line_w=0.5)
    add_rect(slide, x, y, w, Inches(0.06), fill=accent)
    add_text(slide, x+Inches(0.3), y+Inches(0.4), w-Inches(0.6), Inches(1.2),
             big, size=big_size, color=NAVY, bold=True, font=FONT, spacing=1.0)
    add_text(slide, x+Inches(0.3), y+Inches(1.7), w-Inches(0.6), Inches(0.8),
             label, size=14, color=CHARCOAL, font=FONT, spacing=1.35)
    if source:
        add_text(slide, x+Inches(0.3), y+h-Inches(0.5), w-Inches(0.6), Inches(0.3),
                 source, size=10, color=SLATE, font=MONO, letter_spacing=50)


def add_badge(slide, x, y, text, fill=NAVY_SOFT, color=NAVY, size=11):
    text_w = len(text) * 0.11 + 0.4
    add_rounded(slide, x, y, Inches(text_w), Inches(0.4),
                fill=fill, line=None, radius=0.5)
    add_text(slide, x, y, Inches(text_w), Inches(0.4),
             text, size=size, color=color, font=MONO,
             bold=True, align='center', anchor='middle', letter_spacing=50)
    return Inches(text_w)


# ═════════════════════════════════════════════════════════
# SLIDE 1 — TITLE
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

# left half
add_text(s, Inches(0.8), Inches(0.7), Inches(7), Inches(0.4),
         "DIPLOM ISHI  ·  2026", size=13, color=SLATE,
         font=MONO, bold=True, letter_spacing=500)

# huge title
add_text(s, Inches(0.8), Inches(1.5), Inches(7.5), Inches(2.6),
         "KASBIM", size=140, color=NAVY, bold=True, font=FONT, spacing=0.95)

# subtitle
add_runs(s, Inches(0.85), Inches(4.0), Inches(7), Inches(1.5),
    [("Mashinali o'qitishga\nasoslangan ",
        {'size':28, 'color':NAVY, 'bold':True}),
     ("kasb-tavsiya tizimi",
        {'size':28, 'color':EMERALD, 'bold':True})],
    spacing=1.25)

# meta block
y0 = Inches(6.05)
add_runs(s, Inches(0.8), y0, Inches(8), Inches(0.35),
    [("BAJARUVCHI    ", {'size':10, 'color':SLATE, 'font':MONO, 'bold':True}),
     ("Maxmud Elmurodov", {'size':16, 'color':CHARCOAL, 'bold':True})],
    anchor='middle')
add_runs(s, Inches(0.8), y0+Inches(0.45), Inches(8), Inches(0.35),
    [("ILMIY RAHBAR    ", {'size':10, 'color':SLATE, 'font':MONO, 'bold':True}),
     ("[F.I.Sh.]", {'size':16, 'color':CHARCOAL})],
    anchor='middle')

# right: brain network image
s.shapes.add_picture(img_brain, Inches(8.4), Inches(1.8),
                     width=Inches(4.5), height=Inches(4.5))

# subtle label
add_text(s, Inches(8.4), Inches(6.3), Inches(4.5), Inches(0.4),
         "AI · 303 kasb · 88% aniqlik",
         size=12, color=SLATE, font=MONO, align='center', letter_spacing=200)


# ═════════════════════════════════════════════════════════
# SLIDE 2 — MUAMMO
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "01  ·  MUAMMO")
add_title(s, Inches(0.8), Inches(0.95), "Mavzuning dolzarbligi")

# top 4 stats
y = Inches(2.3); w = Inches(2.85); h = Inches(2.55); gap = Inches(0.18)
x0 = Inches(0.8)
add_stat_card(s, x0,           y, w, h, "65%",      "Tanlagan kasbidan\npushaymon yoshlar", NAVY,    "FlexJobs · 2023", big_size=54)
add_stat_card(s, x0+w+gap,     y, w, h, "60%",      "Ixtisosga mos\nishlamaydiganlar",      AMBER,   "OAK", big_size=54)
add_stat_card(s, x0+(w+gap)*2, y, w, h, "13.6%",    "Global yoshlar\nishsizligi",           EMERALD, "ILO · 2024", big_size=48)
add_stat_card(s, x0+(w+gap)*3, y, w, h, "5–7 yil",  "Kasb almashtirishga\nketadigan vaqt",  GOLD,    "OECD", big_size=42)

# bottom chart
s.shapes.add_picture(img_problem, Inches(0.8), Inches(5.05),
                     width=Inches(11.7), height=Inches(1.95))

add_footer(s, 2)


# ═════════════════════════════════════════════════════════
# SLIDE 3 — YECHIM
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "02  ·  YECHIM")
add_title(s, Inches(0.8), Inches(0.95), "Kasbim — AI yordamida tavsiya")

# bold subtitle
add_runs(s, Inches(0.8), Inches(2.05), Inches(11.7), Inches(0.55),
    [("O'zbek tilida ",  {'size':20, 'color':CHARCOAL}),
     ("303 kasb",         {'size':20, 'color':NAVY, 'bold':True}),
     (" uchun shaxsiy tavsiya  ·  ", {'size':20, 'color':CHARCOAL}),
     ("5 daqiqada", {'size':20, 'color':EMERALD, 'bold':True})])

# 3 main process blocks
fy = Inches(2.95); fh = Inches(2.7)

# Block 1: KIRISH
b1x = Inches(0.8); b1w = Inches(3.6)
add_rounded(s, b1x, fy, b1w, fh, fill=WHITE, line=BORDER, radius=0.04, line_w=0.5)
add_rect(s, b1x, fy, b1w, Inches(0.07), fill=NAVY)
add_eyebrow(s, b1x+Inches(0.3), fy+Inches(0.3), "KIRISH", color=NAVY)
add_text(s, b1x+Inches(0.3), fy+Inches(0.75), b1w-Inches(0.6), Inches(0.5),
         "Foydalanuvchi", size=20, color=NAVY, bold=True)

items_in = [("30 ta", "RIASEC savol"),
            ("33 ta", "qiziqish"),
            ("32 ta", "sevimli fan")]
iy = fy+Inches(1.4)
for big, lbl in items_in:
    add_text(s, b1x+Inches(0.3), iy, Inches(1.1), Inches(0.4),
             big, size=18, color=EMERALD, bold=True, font=MONO)
    add_text(s, b1x+Inches(1.4), iy+Inches(0.04), b1w-Inches(1.6), Inches(0.4),
             lbl, size=15, color=CHARCOAL)
    iy += Inches(0.4)

# Arrow 1
ax1 = b1x + b1w + Inches(0.05); aw = Inches(0.65)
add_text(s, ax1, fy, aw, fh, "→", size=46, color=AMBER, bold=True,
         align='center', anchor='middle')

# Block 2: AI ENGINE
b2x = ax1 + aw; b2w = Inches(3.0)
add_rounded(s, b2x, fy, b2w, fh, fill=NAVY, line=None, radius=0.04)
add_eyebrow(s, b2x+Inches(0.3), fy+Inches(0.3), "AI ENGINE",
            color=RGBColor(0xCB, 0xD5, 0xE1))
add_text(s, b2x+Inches(0.3), fy+Inches(0.75), b2w-Inches(0.6), Inches(0.5),
         "Tahlil", size=20, color=WHITE, bold=True)

# brain image (small)
s.shapes.add_picture(img_brain,
    b2x+Inches(0.55), fy+Inches(1.25),
    width=Inches(1.9), height=Inches(1.1))

add_text(s, b2x, fy+fh-Inches(0.45), b2w, Inches(0.35),
         "cosine similarity",
         size=12, color=RGBColor(0xCB, 0xD5, 0xE1), italic=True,
         font=MONO, align='center')

# Arrow 2
ax2 = b2x + b2w + Inches(0.05)
add_text(s, ax2, fy, aw, fh, "→", size=46, color=AMBER, bold=True,
         align='center', anchor='middle')

# Block 3: CHIQISH
b3x = ax2 + aw; b3w = SW - b3x - Inches(0.8)
add_rounded(s, b3x, fy, b3w, fh, fill=WHITE, line=EMERALD, radius=0.04, line_w=2)
add_rect(s, b3x, fy, b3w, Inches(0.07), fill=EMERALD)
add_eyebrow(s, b3x+Inches(0.3), fy+Inches(0.3), "CHIQISH", color=EMERALD)
add_text(s, b3x+Inches(0.3), fy+Inches(0.75), b3w-Inches(0.6), Inches(0.5),
         "Top-5 kasb", size=20, color=NAVY, bold=True)

out_items = [(1, "Data Scientist",   88, NAVY),
             (2, "ML Engineer",       84, EMERALD),
             (3, "Backend Dev",       79, AMBER)]
ry_ = fy + Inches(1.4)
for rank, name, pct, color in out_items:
    add_rounded(s, b3x+Inches(0.3), ry_, Inches(0.35), Inches(0.35),
                fill=color, line=None, radius=0.2)
    add_text(s, b3x+Inches(0.3), ry_, Inches(0.35), Inches(0.35),
             str(rank), size=12, color=WHITE, bold=True, font=MONO,
             align='center', anchor='middle')
    add_text(s, b3x+Inches(0.75), ry_+Inches(0.03), Inches(1.6), Inches(0.35),
             name, size=13, color=CHARCOAL, bold=True, anchor='middle')
    bar_x = b3x+Inches(2.35); bar_w = Inches(0.7)
    add_rounded(s, bar_x, ry_+Inches(0.13), bar_w, Inches(0.1),
                fill=BORDER, line=None, radius=0.5)
    add_rounded(s, bar_x, ry_+Inches(0.13), Emu(int(bar_w * pct/100)), Inches(0.1),
                fill=EMERALD, line=None, radius=0.5)
    add_text(s, bar_x+bar_w+Inches(0.05), ry_, Inches(0.6), Inches(0.35),
             f"{pct}%", size=12, color=EMERALD, bold=True, font=MONO,
             anchor='middle')
    ry_ += Inches(0.4)

# 4 differentiator features
ddy = Inches(5.95); ddh = Inches(1.05)
dw = (SW - Inches(0.8)*2 - Inches(0.2)*3) / 4
features = [("Birinchi", "o'zbek tilida ML", NAVY),
            ("88%+",      "ilmiy aniqligi",   EMERALD),
            ("Izohli",    "har tavsiya sababli", AMBER),
            ("Roadmap",   "6 oylik o'rganish",  GOLD)]
fx = Inches(0.8)
for big, sub, color in features:
    add_rounded(s, fx, ddy, dw, ddh, fill=WHITE, line=BORDER, radius=0.06, line_w=0.5)
    add_rect(s, fx, ddy, Inches(0.08), ddh, fill=color)
    add_text(s, fx+Inches(0.3), ddy+Inches(0.15), dw-Inches(0.5), Inches(0.5),
             big, size=22, color=color, bold=True)
    add_text(s, fx+Inches(0.3), ddy+Inches(0.62), dw-Inches(0.5), Inches(0.4),
             sub, size=13, color=SLATE)
    fx += dw + Inches(0.2)

add_footer(s, 3)


# ═════════════════════════════════════════════════════════
# SLIDE 4 — ARXITEKTURA
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "03  ·  TEXNIK ASOS")
add_title(s, Inches(0.8), Inches(0.95), "Tizim arxitekturasi")

add_text(s, Inches(0.8), Inches(2.0), Inches(11.7), Inches(0.5),
         "4 qatlamli mikrokomponent · REST API · Render.com da deploy",
         size=16, color=SLATE, font=FONT, italic=True)

y = Inches(3.1); h = Inches(2.5)
block_w = Inches(2.6); arrow_w = Inches(0.45)
total_w = block_w*4 + arrow_w*3
start_x = (SW - total_w) / 2

def draw_arch(x, y, w, h, name, sub, accent, icon_char):
    add_rounded(s, x, y, w, h, fill=WHITE, line=BORDER, radius=0.05, line_w=0.5)
    add_rect(s, x, y, w, Inches(0.08), fill=accent)
    icon_size = Inches(0.95)
    ix = x + (w - icon_size)/2; iy = y + Inches(0.35)
    add_rounded(s, ix, iy, icon_size, icon_size,
                fill=BG, line=accent, radius=0.5, line_w=1.5)
    add_text(s, ix, iy, icon_size, icon_size, icon_char,
             size=32, color=accent, bold=True, align='center', anchor='middle')
    add_text(s, x, y+Inches(1.45), w, Inches(0.45), name,
             size=18, color=NAVY, bold=True, align='center', letter_spacing=150)
    add_text(s, x, y+Inches(1.95), w, Inches(0.45), sub,
             size=13, color=SLATE, font=MONO, align='center', spacing=1.3)

x = start_x
draw_arch(x, y, block_w, h, "FRONTEND",  "React 18\nTailwind",  NAVY,    "◧")
x += block_w
add_text(s, x, y, arrow_w, h, "→", size=30, color=AMBER, bold=True,
         align='center', anchor='middle')
x += arrow_w
draw_arch(x, y, block_w, h, "BACKEND",   "FastAPI\nJWT auth",  EMERALD, "⚙")
x += block_w
add_text(s, x, y, arrow_w, h, "→", size=30, color=AMBER, bold=True,
         align='center', anchor='middle')
x += arrow_w
draw_arch(x, y, block_w, h, "ML SERVISI","scikit-learn\njoblib", AMBER,  "✦")
x += block_w
add_text(s, x, y, arrow_w, h, "→", size=30, color=AMBER, bold=True,
         align='center', anchor='middle')
x += arrow_w
draw_arch(x, y, block_w, h, "DATABASE",  "PostgreSQL\nJSONB",   GOLD,    "▣")

# bottom tagline
add_text(s, Inches(0.8), Inches(6.2), Inches(11.7), Inches(0.5),
         "REST endpoints:  /api/auth  ·  /api/test  ·  /api/predict  ·  /api/admin",
         size=13, color=SLATE, font=MONO, align='center', letter_spacing=100)

add_footer(s, 4)


# ═════════════════════════════════════════════════════════
# SLIDE 5 — MODEL + FORMULA
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "04  ·  ALGORITM")
add_title(s, Inches(0.8), Inches(0.95), "Content-Based Filtering")

# left: vector diagram image (large)
s.shapes.add_picture(img_vector, Inches(0.7), Inches(2.3),
                     width=Inches(6.5), height=Inches(4.2))

# formula box below image
add_rounded(s, Inches(0.7), Inches(6.5), Inches(6.5), Inches(0.7),
            fill=SOFT_BG, line=NAVY, radius=0.05, line_w=1)
add_text(s, Inches(0.7), Inches(6.5), Inches(6.5), Inches(0.7),
         "cos(θ)  =  (u · c) / ‖u‖ · ‖c‖",
         size=20, color=NAVY, bold=True, font=SERIF,
         align='center', anchor='middle', italic=True)

# right: 3 steps
sx = Inches(7.5); sy = Inches(2.3); sw = Inches(5.0)

add_text(s, sx, sy, sw, Inches(0.35),
         "3 BOSQICHLI ALGORITM",
         size=12, color=SLATE, font=MONO, bold=True, letter_spacing=400)

step_y = sy + Inches(0.55)
def add_step(idx, label, sub, y):
    add_rounded(s, sx, y, Inches(0.65), Inches(0.65), fill=NAVY, line=None, radius=0.5)
    add_text(s, sx, y, Inches(0.65), Inches(0.65),
             str(idx), size=18, color=WHITE, bold=True, font=MONO,
             align='center', anchor='middle')
    add_text(s, sx+Inches(1), y+Inches(0.02), sw-Inches(1), Inches(0.4),
             label, size=17, color=NAVY, bold=True)
    add_text(s, sx+Inches(1), y+Inches(0.42), sw-Inches(1), Inches(0.5),
             sub, size=13, color=SLATE, spacing=1.3)

add_step(1, "Profil → 101D vektor",
         "6 RIASEC + 30 kategoriya + 33 qiziqish + 32 fan", step_y)
add_step(2, "Burchak orqali o'xshashlik",
         "Har kasb bilan kosinus burchagi", step_y+Inches(1.15))
add_step(3, "Tartiblash → top-5",
         "303 kasbdan eng mosi (<1 ms)", step_y+Inches(2.3))

# bottom advantages
add_rounded(s, sx, step_y+Inches(3.4), sw, Inches(0.75),
            fill=EMERALD_SOFT, line=None, radius=0.1)
add_text(s, sx+Inches(0.2), step_y+Inches(3.4), sw-Inches(0.4), Inches(0.75),
         "✓ cold-start yo'q  ·  ✓ interpretatsiya  ·  ✓ shaffof",
         size=13, color=NAVY, bold=True, align='center', anchor='middle')

add_footer(s, 5)


# ═════════════════════════════════════════════════════════
# SLIDE 6 — RIASEC
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "05  ·  KIRISH MA'LUMOTLAR")
add_title(s, Inches(0.8), Inches(0.95), "RIASEC psixometrik test")

# left: 6 row table
ly = Inches(2.4)
types = [("R", "Realistik",    "muhandis · texnik",    NAVY),
         ("I", "Tadqiqotchi",  "olim · dasturchi",     AMBER),
         ("A", "Ijodkor",      "dizayner · musiqachi", EMERALD),
         ("S", "Ijtimoiy",     "o'qituvchi · vrach",   GOLD),
         ("E", "Tadbirkor",    "menejer · advokat",    NAVY),
         ("C", "Konvensional", "buxgalter · analitik", EMERALD)]
for i, (code, name, ex, color) in enumerate(types):
    row_y = ly + Inches(i * 0.62)
    add_rounded(s, Inches(0.8), row_y, Inches(6.3), Inches(0.55),
                fill=WHITE, line=BORDER, radius=0.08, line_w=0.4)
    # code circle
    add_rounded(s, Inches(0.95), row_y+Inches(0.075), Inches(0.4), Inches(0.4),
                fill=WHITE, line=color, radius=0.5, line_w=2)
    add_text(s, Inches(0.95), row_y+Inches(0.075), Inches(0.4), Inches(0.4),
             code, size=14, color=color, bold=True, font=MONO,
             align='center', anchor='middle')
    add_text(s, Inches(1.55), row_y, Inches(2.0), Inches(0.55),
             name, size=16, color=NAVY, bold=True, anchor='middle')
    add_text(s, Inches(3.6), row_y, Inches(3.3), Inches(0.55),
             ex, size=14, color=SLATE, anchor='middle')

# explainer at bottom
add_text(s, Inches(0.8), Inches(6.4), Inches(6.3), Inches(0.5),
         "30 ta savol  ×  Likert 1–5  →  har tip uchun 0–10 ball",
         size=14, color=NAVY, font=MONO, bold=True, align='center')

# right: hexagon image
s.shapes.add_picture(img_riasec, Inches(7.5), Inches(2.0),
                     width=Inches(5.2), height=Inches(5.2))

add_footer(s, 6)


# ═════════════════════════════════════════════════════════
# SLIDE 7 — NATIJALAR (chart bilan)
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "06  ·  NATIJALAR")
add_title(s, Inches(0.8), Inches(0.95), "6 modelni taqqoslash")

# RESULTS CHART (matplotlib image)
s.shapes.add_picture(img_results, Inches(0.8), Inches(2.1),
                     width=Inches(8.4), height=Inches(4.6))

# right: key results panel
rx = Inches(9.5); ry = Inches(2.1); rw = Inches(3.4)
# 3 key boxes
def big_box(x, y, w, h, big, label, color):
    add_rounded(s, x, y, w, h, fill=WHITE, line=BORDER, radius=0.06, line_w=0.5)
    add_rect(s, x, y, w, Inches(0.06), fill=color)
    add_text(s, x+Inches(0.25), y+Inches(0.25), w-Inches(0.5), Inches(0.7),
             big, size=36, color=color, bold=True)
    add_text(s, x+Inches(0.25), y+Inches(0.95), w-Inches(0.5), Inches(0.5),
             label, size=12, color=CHARCOAL, spacing=1.35)

big_box(rx, ry,                rw, Inches(1.4), "88.45%", "Precision@5\neng yuqori", EMERALD)
big_box(rx, ry+Inches(1.55),   rw, Inches(1.4), "53.6×",  "tasodifdan\naniqroq",     NAVY)
big_box(rx, ry+Inches(3.1),    rw, Inches(1.4), "100%",   "303 kasbni qamrab\noladi", AMBER)

# bottom tagline
add_text(s, Inches(0.8), Inches(6.85), Inches(11.7), Inches(0.35),
         "Test to'plami N=303 cold-start senariosi  ·  yashil chiziq — yutuvchi modellar",
         size=12, color=SLATE, font=MONO, italic=True, align='center')

add_footer(s, 7)


# ═════════════════════════════════════════════════════════
# SLIDE 8 — EKSPERIMENT
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "07  ·  EKSPERIMENT")
add_title(s, Inches(0.8), Inches(0.95), "Modelni qanday sinaganmiz")

# Pipeline image
s.shapes.add_picture(img_pipeline, Inches(0.8), Inches(2.3),
                     width=Inches(11.7), height=Inches(2.5))

# Bottom row: 2 panels — Modellar va Metrikalar
py = Inches(5.0); ph = Inches(1.95); pw = Inches(5.65); pgap = Inches(0.4)
px = Inches(0.8)

# Models panel
add_rounded(s, px, py, pw, ph, fill=WHITE, line=BORDER, radius=0.04, line_w=0.5)
add_text(s, px+Inches(0.3), py+Inches(0.15), pw-Inches(0.6), Inches(0.4),
         "TAQQOSLANGAN MODELLAR (6)",
         size=12, color=SLATE, font=MONO, bold=True, letter_spacing=300)
models = [("Random", NAVY_SOFT, NAVY),
          ("Popularity", NAVY_SOFT, NAVY),
          ("CF-NMF", AMBER_SOFT, AMBER),
          ("CF-SVD", AMBER_SOFT, AMBER),
          ("Content-Based", EMERALD_SOFT, EMERALD),
          ("Hybrid", EMERALD_SOFT, EMERALD)]
bx = px+Inches(0.3); by = py+Inches(0.7)
for label, fill, col in models:
    used_w = add_badge(s, bx, by, label, fill=fill, color=col, size=11)
    bx += used_w + Inches(0.08)
    if bx > px+pw-Inches(1.5):
        bx = px+Inches(0.3); by += Inches(0.5)

# Metrics panel
px2 = px + pw + pgap
add_rounded(s, px2, py, pw, ph, fill=WHITE, line=BORDER, radius=0.04, line_w=0.5)
add_text(s, px2+Inches(0.3), py+Inches(0.15), pw-Inches(0.6), Inches(0.4),
         "BAHOLASH METRIKALARI (5)",
         size=12, color=SLATE, font=MONO, bold=True, letter_spacing=300)
metrics = ["Precision@K", "NDCG@K", "MRR", "Hit Rate", "Coverage"]
bx = px2+Inches(0.3); by = py+Inches(0.7)
for m in metrics:
    used_w = add_badge(s, bx, by, m, fill=NAVY_SOFT, color=NAVY, size=11)
    bx += used_w + Inches(0.08)
    if bx > px2+pw-Inches(1.5):
        bx = px2+Inches(0.3); by += Inches(0.5)

add_footer(s, 8)


# ═════════════════════════════════════════════════════════
# SLIDE 9 — DEMO / KELAJAK
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "08  ·  WEB ILOVA")
add_title(s, Inches(0.8), Inches(0.95), "Sayt ishlamoqda  ·  Demo")

# Left: URL pill + tech + steps
lx = Inches(0.8); ly = Inches(2.3); lw = Inches(5.8)
add_rounded(s, lx, ly, lw, Inches(0.95), fill=WHITE, line=NAVY, radius=0.08, line_w=1.5)
add_text(s, lx, ly, lw, Inches(0.95),
         "kasbim-frontend.onrender.com",
         size=22, color=NAVY, bold=True, font=MONO,
         align='center', anchor='middle')

add_text(s, lx, ly+Inches(1.35), lw, Inches(0.35),
         "TECH STACK",
         size=12, color=SLATE, font=MONO, bold=True, letter_spacing=400)

techs = [("React 18", NAVY_SOFT, NAVY),
         ("Vite", NAVY_SOFT, NAVY),
         ("Tailwind", NAVY_SOFT, NAVY),
         ("FastAPI", EMERALD_SOFT, EMERALD),
         ("PostgreSQL", EMERALD_SOFT, EMERALD),
         ("scikit-learn", AMBER_SOFT, AMBER)]
tx = lx; ty_ = ly+Inches(1.75)
for label, fill, col in techs:
    used = add_badge(s, tx, ty_, label, fill=fill, color=col, size=11)
    tx += used + Inches(0.08)
    if tx > lx+lw-Inches(0.8):
        tx = lx; ty_ += Inches(0.5)

add_text(s, lx, ty_+Inches(0.65), lw, Inches(0.35),
         "5 QADAM",
         size=12, color=SLATE, font=MONO, bold=True, letter_spacing=400)
add_runs(s, lx, ty_+Inches(1.05), lw, Inches(0.5),
    [("Ro'yxat → 30 savol → Qiziqishlar → ",
        {'size':14, 'color':SLATE, 'font':MONO}),
     ("Top-5", {'size':14, 'color':EMERALD, 'bold':True}),
     (" → Roadmap", {'size':14, 'color':SLATE, 'font':MONO})])

# Right: laptop mockup
rx = Inches(7.0); ry = Inches(2.3); rw = Inches(5.5); rh = Inches(4.3)
add_rounded(s, rx, ry, rw, rh, fill=WHITE, line=BORDER, radius=0.03, line_w=0.5)

# header bar
add_rect(s, rx, ry, rw, Inches(0.5), fill=SOFT_BG)
for i, c in enumerate([RGBColor(0xEF,0x44,0x44),
                       RGBColor(0xF5,0x9E,0x0B),
                       RGBColor(0x10,0xB9,0x81)]):
    dot = s.shapes.add_shape(MSO_SHAPE.OVAL,
        rx+Inches(0.18+i*0.27), ry+Inches(0.16), Inches(0.17), Inches(0.17))
    dot.shadow.inherit = False
    dot.fill.solid(); dot.fill.fore_color.rgb = c
    dot.line.fill.background()
add_text(s, rx+Inches(1.2), ry, rw-Inches(1.2), Inches(0.5),
         "kasbim · top-5 tavsiyalar",
         size=12, color=SLATE, font=MONO, anchor='middle')

# 5 result rows
results = [(1, "Data Scientist",     0.88, NAVY),
           (2, "ML Engineer",        0.84, EMERALD),
           (3, "Backend Developer",  0.79, AMBER),
           (4, "Data Analyst",       0.76, GOLD),
           (5, "Research Scientist", 0.71, SLATE)]
row_y = ry + Inches(0.75)
for rank, name, pct, color in results:
    add_rounded(s, rx+Inches(0.25), row_y, Inches(0.55), Inches(0.55),
                fill=color, line=None, radius=0.15)
    add_text(s, rx+Inches(0.25), row_y, Inches(0.55), Inches(0.55),
             str(rank), size=15, color=WHITE, bold=True, font=MONO,
             align='center', anchor='middle')
    add_text(s, rx+Inches(1.0), row_y, Inches(2.2), Inches(0.55),
             name, size=14, color=CHARCOAL, bold=True, anchor='middle')
    bar_x = rx + Inches(3.3); bar_w = Inches(1.4)
    add_rounded(s, bar_x, row_y+Inches(0.22), bar_w, Inches(0.13),
                fill=BORDER, line=None, radius=0.5)
    add_rounded(s, bar_x, row_y+Inches(0.22), Emu(int(bar_w*pct)), Inches(0.13),
                fill=EMERALD, line=None, radius=0.5)
    add_text(s, rx+Inches(4.85), row_y, Inches(0.6), Inches(0.55),
             f"{int(pct*100)}%", size=14, color=EMERALD, bold=True,
             font=MONO, align='right', anchor='middle')
    row_y += Inches(0.68)

add_footer(s, 9)


# ═════════════════════════════════════════════════════════
# SLIDE 10 — XULOSA + KELAJAK + RAHMAT
# ═════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); set_bg(s, BG); add_top_bar(s)

add_eyebrow(s, Inches(0.8), Inches(0.55), "09  ·  XULOSA")
add_title(s, Inches(0.8), Inches(0.95), "Xulosa va kelajak rejalari", size=44)

# 2 columns
cy = Inches(2.3); cw = Inches(5.8); ch = Inches(2.7)
# Erishildi
add_rounded(s, Inches(0.8), cy, cw, ch, fill=WHITE, line=BORDER, radius=0.04, line_w=0.5)
add_rect(s, Inches(0.8), cy, Inches(0.08), ch, fill=EMERALD)
add_text(s, Inches(1.05), cy+Inches(0.25), cw-Inches(0.5), Inches(0.4),
         "ERISHILDI", size=13, color=EMERALD, font=MONO, bold=True, letter_spacing=400)
achievements = [
    "O'zbek tilida birinchi ML kasb-tavsiya tizimi",
    "88.45% Precision@5 — ilmiy darajada",
    "Internetga joylashtirilgan, ochiq kodli",
]
ay = cy + Inches(0.85)
for item in achievements:
    add_text(s, Inches(1.4), ay, Inches(0.3), Inches(0.4),
             "✓", size=16, color=EMERALD, bold=True, anchor='top')
    add_text(s, Inches(1.7), ay, cw-Inches(0.8), Inches(0.5),
             item, size=14, color=CHARCOAL, spacing=1.3)
    ay += Inches(0.55)

# Kelajak
fx2 = Inches(0.8) + cw + Inches(0.3)
add_rounded(s, fx2, cy, cw, ch, fill=WHITE, line=BORDER, radius=0.04, line_w=0.5)
add_rect(s, fx2, cy, Inches(0.08), ch, fill=AMBER)
add_text(s, fx2+Inches(0.25), cy+Inches(0.25), cw-Inches(0.5), Inches(0.4),
         "KELAJAK", size=13, color=AMBER, font=MONO, bold=True, letter_spacing=400)
futures = [
    "Real foydalanuvchi data → adaptiv α",
    "HeadHunter, EmployUz API integratsiya",
    "Telegram-bot va maktab tizimiga taklif",
]
ay = cy + Inches(0.85)
for item in futures:
    add_text(s, fx2+Inches(0.6), ay, Inches(0.3), Inches(0.4),
             "→", size=18, color=AMBER, bold=True, anchor='top')
    add_text(s, fx2+Inches(0.95), ay, cw-Inches(1.1), Inches(0.5),
             item, size=14, color=CHARCOAL, spacing=1.3)
    ay += Inches(0.55)

# Rahmat banner at bottom
add_rounded(s, Inches(0.8), Inches(5.4), Inches(11.7), Inches(1.4),
            fill=SOFT_BG, line=NAVY, radius=0.04, line_w=1.2)
add_text(s, Inches(0.8), Inches(5.4), Inches(11.7), Inches(0.8),
         "E'tiboringiz uchun rahmat",
         size=42, color=NAVY, bold=True, font=SERIF,
         align='center', anchor='middle')
add_text(s, Inches(0.8), Inches(6.15), Inches(11.7), Inches(0.5),
         "Savollaringizga tayyorman  ·  kasbim-frontend.onrender.com",
         size=13, color=SLATE, font=MONO, align='center')

add_footer(s, 10)


# ═════════════════════════════════════════════════════════
# SAVE
# ═════════════════════════════════════════════════════════
output = "Kasbim_Prezentatsiya.pptx"
prs.save(output)
print(f"Tayyor: {output}  ({len(prs.slides)} slayd)")
