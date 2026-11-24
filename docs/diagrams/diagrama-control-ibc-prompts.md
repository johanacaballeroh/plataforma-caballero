# Diagrama de datos con Control IBC

Generado mediante la herramienta integrada image_gen (edicion de imagen), sin CLI/API externa.

Fuente de las tablas IBC: supabase/ibc.sql. Los cinco grupos anteriores se tomaron de la imagen aportada por la usuaria y no se revisaron contra el esquema actual. Los recuadros companies (referencia) y profiles (referencia) son referencias a tablas existentes, no tablas nuevas. Los nombres sobre los conectores IBC identifican las claves foraneas relacionadas.

## Prompt inicial

Use case: infographic-diagram, precise edit of an existing database diagram.
Asset type: updated entity relationship diagram for a Spanish university internship report about Plataforma Caballero.
Input image 1 is the EDIT TARGET. It contains the existing database diagram. Preserve its full five sections, all existing table cards, their labels, their data fields, relationships, colors and legend. Do not remove, redesign, crop or replace the original diagram. Extend the white canvas BELOW the existing diagram to add one new full-width section. The old diagram should remain intact at the top; scale the entire image proportionally for legibility if necessary, never compress the old portion to squeeze in more tables. Produce a high resolution, clean, sharp image; roughly portrait, with ample room for the new section, approximately twice the original canvas height. Do not add a huge title.

MATCH DESIGN: clean white background, very pale translucent section fills, fine pastel-colored rectangular outlines with slightly rounded corners, tiny professional sans serif typography, colored circular section number with adjacent colored title chip, compact database table cards with narrow header bands, thin orthogonal relationship lines, 1-to-many crow's-foot markers, PK blue and FK red. Follow exactly the visual language of the source. New sixth section has a muted rose/coral accent distinct from the five existing section colors. Heading EXACTLY: "6  Control IBC". No decorative IBC drawings, no workflow graphic.

NEW SECTION: Exactly FIVE new actual table cards, with these exact SQL names and field labels. All fields below must be present, correctly spelled, one field per line. PK and FK marks as indicated; UQ denotes a unique constraint. Use the same legible body text scale as the old table cards. Allocate tall enough cards to fit fields; do not abbreviate field names or replace fields with ellipses. Arrange the two small master cards on the left, tall service-cycle card near the center, event and document cards on the right; keep clear corridors for connector lines. You may stack small cards where helpful. The new section must have generous height to avoid crowding.

Card "ibc_containers":
id (PK)
code (UQ)
original_number
notes
status
created_by (FK)
updated_by (FK)
created_at
updated_at

Card "ibc_chemicals":
id (PK)
name
description
status
created_by (FK)
updated_by (FK)
created_at
updated_at

Card "ibc_service_cycles":
id (PK)
container_id (FK)
company_id (FK)
chemical_id (FK)
company_name
chemical_name
received_at
gre_entry
purchase_order
notes
legacy_rotation
source_reference
is_demo
status
requires_release
delivered_at
recipient_company_id (FK)
gre_exit
created_by (FK)
updated_by (FK)
created_at
updated_at

Card "ibc_service_events":
id (PK)
sequence (UQ)
cycle_id (FK)
kind
happened_at
result
notes
recipient_company_id (FK)
gre_exit
resulting_status
created_by (FK)
created_at

Card "ibc_documents":
id (PK)
cycle_id (FK)
document_kind
file_name
storage_bucket (Storage)
storage_path (Storage, UQ)
mime_type
size_bytes
created_by (FK)
created_at

EXACT NEW RELATIONSHIPS:
ibc_containers.id (1) to ibc_service_cycles.container_id (N).
ibc_chemicals.id (1) to ibc_service_cycles.chemical_id (N).
ibc_service_cycles.id (1) to ibc_service_events.cycle_id (N).
ibc_service_cycles.id (1) to ibc_documents.cycle_id (N).
Existing companies.id (1) to ibc_service_cycles.company_id (N), label "solicitante".
Existing companies.id (1) to ibc_service_cycles.recipient_company_id (N), label "receptora".
Existing companies.id (1) to ibc_service_events.recipient_company_id (N).
Existing profiles.id (1) to the created_by and updated_by FK fields in ibc_containers, ibc_chemicals and ibc_service_cycles; existing profiles.id (1) to created_by in ibc_service_events and ibc_documents.
For shared companies/profiles relationships, you may place two small proxy reference cards within the new section headed "companies (referencia)" and "profiles (referencia)", each containing only "id (PK)", matching their existing green/blue coloring, with dashed reference connectors. These are references to existing tables, never new tables. Using grouped dashed reference connectors to the FK fields is acceptable to avoid visual clutter; every FK destination must remain clear. Do NOT draw any relationship between certificates/items and IBC: there is no such FK.
Do NOT add tables for washes, tests or repairs: those are events in ibc_service_events. Do NOT draw v_ibc_services or v_ibc_containers as tables. audit_logs is an existing table, not a new FK target for the event card. No invented database fields, no new badges or status colors inferred from the original Excel sheet.

At the bottom of the new section include a small concise note in Spanish:
"5 tablas nuevas · PK UUID · RLS habilitado · Archivos en Supabase Storage"
"Un envase conserva varios ciclos; solo uno puede permanecer abierto."
Preserve the original legend; if adding UQ include "UQ = valor único". Keep text true to SQL: original_number is NOT unique, while code is unique; chemical name uniqueness is case-insensitive but no need to annotate the expression. No watermarks. High accuracy, complete readable field names, clean professional academic diagram.

## Correccion de conectores

Use case: precise-object-edit of an ER database diagram. Input image 1 is the edit target, the full database diagram already including the rose section 6 Control IBC.
CHANGE ONLY FOUR SOLID BLACK CONNECTORS in the lower rose Control IBC section. Preserve ALL other pixels/content, existing upper five sections, all five IBC table cards, ALL field names, positions, card sizes, colors, reference boxes, dashed cross-module connectors, footer and legend. Do not change any text already in any table.
The current four solid black connectors between the five IBC cards have ambiguous row attachments. Remove those four solid black lines and their tiny cardinality marks cleanly, then redraw FOUR clearly labeled correct 1-to-many relationships between those SAME cards:
1) ibc_containers.id -> ibc_service_cycles.container_id; "1" at containers, crowfoot at cycles, line label EXACTLY "container_id".
2) ibc_chemicals.id -> ibc_service_cycles.chemical_id; "1" at chemicals, crowfoot at cycles, line label EXACTLY "chemical_id".
3) ibc_service_cycles.id -> ibc_service_events.cycle_id; "1" at cycles, crowfoot at events, line label EXACTLY "cycle_id".
4) ibc_service_cycles.id -> ibc_documents.cycle_id; "1" at cycles, crowfoot at documents, line label EXACTLY "cycle_id".
Use thin orthogonal connector lines with elbow bends in the empty corridors between cards. Connect card borders without obscuring any body text; field name labels on the lines explicitly specify each FK target. Anchor at the actual PK/FK row heights where space allows. Route the chemicals line upward through the clear gap between the left cards and central card to reach the central chemical_id row near its top; do not terminate it near status or recipient_company_id. Route the cycle-to-documents relationship along the clear gap to the right of the cycle card. Keep the diagram sharp and readable. Everything else must stay unchanged. Do not add other tables or relationships. This is a technical correction only.

