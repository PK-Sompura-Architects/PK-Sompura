# Photo archive audit (D:\projects\ALBUM-IMAGES, read-only)

## Counts (measured)
- **1,352 unique images** (MD5-deduplicated). The brief's "about 1,706" includes duplicates.
- `work_website_images\` is `OUR WORK PHOTO\` nested one level deeper (`work_website_images\OUR WORK PHOTO\…`); `diff -rq` is clean. Use `OUR WORK PHOTO\` only.
- **Orange date stamp** (bottom-right): 101 detected, including **all 82** in `NIKON CAMERA\` (Coolpix P510, 4608×3456). Detector is strict (orange only); contact sheets show no other stamp colour in the sampled folders.
- **Redmi Note 11 watermark** ("REDMI NOTE 11 | KASHYAP" + date): 118 images, identified by EXIF model `2201117TI`. In the files checked it is **white text in the bottom-left corner**, not a black banner. Fix: crop the bottom ~6%.
- **Under 1 MP:** 183 images (WhatsApp forwards). Usable only as small thumbnails.
- Several frames show people (workers, visitors, and portraits of family elders in `CNC Works`). Per the brief, exclude any image with an identifiable person.

## CNC machines: verification status
Frames reviewed at full size, rotated upright (NIKON frames need +90°):
| # | Machine | Frames | Confidence |
|---|---|---|---|
| A | Red NT-branded multi-head gantry router (4 heads on a black beam, black controller) | DSCN2396, 2397, 2398 | confirmed |
| B | Red NT gantry, 2 heads marked "1" and "2", same bay style | DSCN2410, 2411, 2413; also left edge of 2412 | confirmed as a gantry; **may be the same machine as A** photographed from the other end |
| C | Single-spindle gantry on a black toothed beam with orange control console, on rails | DSCN2412 (centre) | confirmed |
| D | Grey single-spindle gantry in a separate white-walled bay | DSCN2402, 2403 | confirmed |
| — | Spindle cutting a sandstone block (clean, portrait) | `OUR WORK PHOTO\cnc work\IMG-20200624-WA0008.jpeg` | a machine head; can't tell which machine |
| — | Bridge block saw | `FACTORY\DSCN0676.jpg`, NIKON DSCN2405 | **not a CNC router** |
| — | DSCN2404 | neighbouring shed | can't identify as a CNC router |

**Verdict:** 3 distinct CNC routers confirmed with certainty (A/B, C, D), possibly 4 if A and B are separate. **A fifth machine cannot be identified from the archive.** Recommendation: state "five CNC machines" as a business fact (the client's claim), and ask for one clean wide photo of the machine hall to show all five.

## Strongest material, by story
- **Mountain temples (the differentiator):**
  - Gulbarga finished: `GULBARGA` #006, #007 (4160×3120, red rock massif with white shikharas, clean, no people). #008 and #009 have a person in frame; crop or skip them.
  - Build sequence at Gulbarga: foundation grid, rebar, rubble core, then the finished massif (#010–#047).
  - Pencil elevation sketches of mountain designs: `FERO` #048, #049.
  - **3D viewport screenshots of a mountain model already made**: `FERO` #068–#070 (4128×1908). Ask the client for the source file; it could seed the 3D scene.
  - Models: clay mountain being sculpted (NIKON DSCN2346–2363, stamped), painted finished model (NIKON DSCN2429–2438, stamped), older lit models (`GULBARGA` #000–#004, #021, #022).
  - Interior of a finished mountain: cave passages, trees, lighting (`FERO` #038–#047, low-res 960×1280).
- **Finished stone temples:** NIKON DSCN2489–2500 (sharpest; stamped; clean up by cropping or inpainting the stamp).
- **Carving / CNC output:** `CNC Works` and `cnc work`: sandstone jali and panels (#020–#023, #064–#066, #072–#074, all 3120–4608 px); a CNC-cut yantra panel (#048–#051).

## Handling rules for the build
- Keep originals where they are; export selected images only, into `media/`, as AVIF + WebP at 480/960/1600/2400 widths.
- Crop the stamp or Redmi strip where the composition allows; otherwise heal it (inpaint) and mark the file `-retouched`.
