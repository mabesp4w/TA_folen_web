# Graph Report - website  (2026-09-18)

## Corpus Check
- 92 files · ~106,846 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2264 nodes · 2524 edges · 95 communities (43 shown, 49 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Prisma Namespace Types
- Ibadah Model
- Jemaat Model
- BadanPengurus Model
- Unsur Model
- Keuangan Model
- User Auth Model
- GaleriFoto Model
- GaleriAlbum Model
- Kehadiran Model
- LogAktivitas Model
- Majelis Model
- Pendeta Model
- Rayon Model
- Pengumuman Model
- Slide Model
- Renungan Model
- Auth & Utilities
- Prisma Browser Types
- Prisma Client Class
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92

## God Nodes (most connected - your core abstractions)
1. `PrismaClient` - 26 edges
2. `getAdminSession()` - 21 edges
3. `recordAdminAudit()` - 17 edges
4. `BadanPengurusDelegate` - 16 edges
5. `GaleriAlbumDelegate` - 16 edges
6. `GaleriFotoDelegate` - 16 edges
7. `IbadahDelegate` - 16 edges
8. `JemaatDelegate` - 16 edges
9. `KehadiranDelegate` - 16 edges
10. `KeuanganDelegate` - 16 edges

## Surprising Connections (you probably didn't know these)
- `InputPassword` --implements--> `Church Member Login Flow`  [INFERRED]
  AGENTS.md → PRODUCT.md
- `Checkbox` --implements--> `Church Member Login Flow`  [INFERRED]
  AGENTS.md → PRODUCT.md
- `Responsive Layout Requirements` --rationale_for--> `Church Member Login Flow`  [INFERRED]
  AGENTS.md → PRODUCT.md
- `AdminLayout()` --calls--> `getAdminSession()`  [EXTRACTED]
  app/admin/layout.tsx → lib/auth-server.ts
- `createJemaatAction()` --calls--> `recordAdminAudit()`  [EXTRACTED]
  components/admin/jemaat/actions.ts → lib/admin-audit.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Visual Direction System for GKI Syaloom Pasifik Indah** — hangat_papua_modern, gki_syaloom_pasifik_indah, color_system_tokens, daisy_ui [INFERRED 0.90]
- **Shared Form Component Library** — input_text, input_password, select_component, checkbox_component, form_field [EXTRACTED 1.00]

## Communities (95 total, 49 thin omitted)

### Community 0 - "Prisma Namespace Types"
Cohesion: 0.01
Nodes (136): AnyNull, Args, At, AtLeast, AtLoose, AtStrict, BadanPengurusOrderByRelevanceFieldEnum, BadanPengurusScalarFieldEnum (+128 more)

### Community 1 - "Ibadah Model"
Cohesion: 0.01
Nodes (135): AggregateIbadah, BoolFieldUpdateOperationsInput, GetIbadahAggregateType, GetIbadahGroupByPayload, Ibadah$jemaatArgs, Ibadah$kehadiranArgs, Ibadah$keuanganArgs, Ibadah$pelayanArgs (+127 more)

### Community 2 - "Jemaat Model"
Cohesion: 0.02
Nodes (131): AggregateJemaat, DateTimeFieldUpdateOperationsInput, GetJemaatAggregateType, GetJemaatGroupByPayload, Jemaat$badan_pengurusArgs, Jemaat$ibadah_pelayanArgs, Jemaat$ibadahArgs, Jemaat$majelisArgs (+123 more)

### Community 3 - "BadanPengurus Model"
Cohesion: 0.02
Nodes (102): AggregateBadanPengurus, BadanPengurus$userArgs, BadanPengurusAggregateArgs, BadanPengurusAvgAggregateInputType, BadanPengurusAvgAggregateOutputType, BadanPengurusAvgOrderByAggregateInput, BadanPengurusCountAggregateInputType, BadanPengurusCountAggregateOutputType (+94 more)

### Community 4 - "Unsur Model"
Cohesion: 0.03
Nodes (77): AggregateUnsur, GetUnsurAggregateType, GetUnsurGroupByPayload, Unsur$badan_pengurusArgs, Unsur$ibadahArgs, UnsurAggregateArgs, UnsurCountAggregateInputType, UnsurCountAggregateOutputType (+69 more)

### Community 5 - "Keuangan Model"
Cohesion: 0.03
Nodes (75): AggregateKeuangan, GetKeuanganAggregateType, GetKeuanganGroupByPayload, Keuangan$ibadahArgs, KeuanganAggregateArgs, KeuanganAvgAggregateInputType, KeuanganAvgAggregateOutputType, KeuanganAvgOrderByAggregateInput (+67 more)

### Community 6 - "User Auth Model"
Cohesion: 0.03
Nodes (75): AggregateUser, GetUserAggregateType, GetUserGroupByPayload, User$badan_pengurusArgs, User$log_aktivitasArgs, UserAggregateArgs, UserCountAggregateInputType, UserCountAggregateOutputType (+67 more)

### Community 7 - "GaleriFoto Model"
Cohesion: 0.03
Nodes (74): AggregateGaleriFoto, GaleriFotoAggregateArgs, GaleriFotoAvgAggregateInputType, GaleriFotoAvgAggregateOutputType, GaleriFotoAvgOrderByAggregateInput, GaleriFotoCountAggregateInputType, GaleriFotoCountAggregateOutputType, GaleriFotoCountArgs (+66 more)

### Community 8 - "GaleriAlbum Model"
Cohesion: 0.03
Nodes (72): AggregateGaleriAlbum, GaleriAlbum$fotoArgs, GaleriAlbumAggregateArgs, GaleriAlbumAvgAggregateInputType, GaleriAlbumAvgAggregateOutputType, GaleriAlbumAvgOrderByAggregateInput, GaleriAlbumCountAggregateInputType, GaleriAlbumCountAggregateOutputType (+64 more)

### Community 9 - "Kehadiran Model"
Cohesion: 0.03
Nodes (69): AggregateKehadiran, GetKehadiranAggregateType, GetKehadiranGroupByPayload, IntFieldUpdateOperationsInput, KehadiranAggregateArgs, KehadiranAvgAggregateInputType, KehadiranAvgAggregateOutputType, KehadiranAvgOrderByAggregateInput (+61 more)

### Community 10 - "LogAktivitas Model"
Cohesion: 0.03
Nodes (69): AggregateLogAktivitas, GetLogAktivitasAggregateType, GetLogAktivitasGroupByPayload, LogAktivitas$userArgs, LogAktivitasAggregateArgs, LogAktivitasCountAggregateInputType, LogAktivitasCountAggregateOutputType, LogAktivitasCountArgs (+61 more)

### Community 11 - "Majelis Model"
Cohesion: 0.03
Nodes (68): AggregateMajelis, GetMajelisAggregateType, GetMajelisGroupByPayload, MajelisAggregateArgs, MajelisCountAggregateInputType, MajelisCountAggregateOutputType, MajelisCountArgs, MajelisCountOrderByAggregateInput (+60 more)

### Community 12 - "Pendeta Model"
Cohesion: 0.03
Nodes (68): AggregatePendeta, GetPendetaAggregateType, GetPendetaGroupByPayload, PendetaAggregateArgs, PendetaCountAggregateInputType, PendetaCountAggregateOutputType, PendetaCountArgs, PendetaCountOrderByAggregateInput (+60 more)

### Community 13 - "Rayon Model"
Cohesion: 0.03
Nodes (66): AggregateRayon, GetRayonAggregateType, GetRayonGroupByPayload, Rayon$jemaatArgs, RayonAggregateArgs, RayonCountAggregateInputType, RayonCountAggregateOutputType, RayonCountArgs (+58 more)

### Community 14 - "Pengumuman Model"
Cohesion: 0.04
Nodes (55): AggregatePengumuman, GetPengumumanAggregateType, GetPengumumanGroupByPayload, PengumumanAggregateArgs, PengumumanAvgAggregateInputType, PengumumanAvgAggregateOutputType, PengumumanAvgOrderByAggregateInput, PengumumanCountAggregateInputType (+47 more)

### Community 15 - "Slide Model"
Cohesion: 0.04
Nodes (55): AggregateSlide, GetSlideAggregateType, GetSlideGroupByPayload, SlideAggregateArgs, SlideAvgAggregateInputType, SlideAvgAggregateOutputType, SlideAvgOrderByAggregateInput, SlideCountAggregateInputType (+47 more)

### Community 16 - "Renungan Model"
Cohesion: 0.04
Nodes (49): AggregateRenungan, GetRenunganAggregateType, GetRenunganGroupByPayload, RenunganAggregateArgs, RenunganCountAggregateInputType, RenunganCountAggregateOutputType, RenunganCountArgs, RenunganCountOrderByAggregateInput (+41 more)

### Community 17 - "Auth & Utilities"
Cohesion: 0.05
Nodes (41): hashPassword(), BadanPengurus, $Enums, GaleriAlbum, GaleriFoto, Ibadah, Jemaat, Kehadiran (+33 more)

### Community 18 - "Prisma Browser Types"
Cohesion: 0.05
Nodes (41): AnyNull, BadanPengurusOrderByRelevanceFieldEnum, BadanPengurusScalarFieldEnum, DbNull, Decimal, GaleriAlbumOrderByRelevanceFieldEnum, GaleriAlbumScalarFieldEnum, GaleriFotoOrderByRelevanceFieldEnum (+33 more)

### Community 19 - "Prisma Client Class"
Cohesion: 0.06
Nodes (4): config, LogOptions, PrismaClient, PrismaClientConstructor

### Community 20 - "Community 20"
Cohesion: 0.06
Nodes (31): BoolFilter, BoolWithAggregatesFilter, DateTimeFilter, DateTimeNullableFilter, DateTimeNullableWithAggregatesFilter, DateTimeWithAggregatesFilter, IntFilter, IntNullableFilter (+23 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (25): daisyui, eslint, eslint-config-next, devDependencies, daisyui, eslint, eslint-config-next, prisma (+17 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (15): metadata, SearchParams, DialogMode, formatDate(), JemaatManager(), JemaatRow, RayonOption, useDebounce() (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (15): authorize(), createUnsurAction(), deleteUnsurAction(), failure(), parseForm(), updateUnsurAction(), initialUnsurActionState, UnsurActionState (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (23): framer-motion, goey-toast, lucide-react, next, dependencies, framer-motion, goey-toast, lucide-react (+15 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (14): authorize(), createRayonAction(), deleteRayonAction(), failure(), parseForm(), updateRayonAction(), DialogMode, RayonManager() (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (15): POST(), POST(), clearSessionCookie(), createSessionToken(), getSecret(), getSession(), SafeUser, SESSION_COOKIE (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (15): authorize(), config, createMasterDataAction(), deleteMasterDataAction(), failure(), parseResource(), Resource, updateMasterDataAction() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (16): sanitizeRichText(), waktuToDate(), adapter, JADWAL, JEMAAT_CONTOH, main(), PENGUMUMAN, prisma (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (15): Accessibility Requirements, Checkbox, Church Member Login Flow, Color System Tokens, DaisyUI, Geist Font, GKI Syaloom Pasifik Indah, Hangat Papua Modern (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.16
Nodes (9): metadata, SearchParams, metadata, SearchParams, AuditInput, Session, PrismaClient, globalForPrisma (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (7): DashboardHeader(), OverviewStats(), stats, activities, RecentActivities(), agendas, UpcomingAgenda()

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (11): adminItems, AppSidebar(), AppSidebarProps, getOpenGroups(), isActiveHref(), isGroupActive(), isSidebarGroup(), navLinkClassName() (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.21
Nodes (8): FormField(), FormFieldProps, InputPassword(), InputPasswordProps, InputTextProps, Select(), SelectOption, SelectProps

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (12): scripts, build, db:generate, db:push, db:reset, db:seed, db:studio, dev (+4 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (5): FormErrors, LoginAccessForm(), Checkbox(), CheckboxProps, InputText()

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (7): AdminShell(), Button(), ButtonProps, ButtonSize, ButtonVariant, sizeClasses, variantClasses

### Community 54 - "Community 54"
Cohesion: 0.49
Nodes (8): AdminLayout(), authorize(), createJemaatAction(), deleteJemaatAction(), failure(), parseForm(), updateJemaatAction(), getAdminSession()

### Community 58 - "Community 58"
Cohesion: 0.47
Nodes (5): DatePicker(), DatePickerProps, formatDate(), months, parseDate()

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (4): Options, sanitize-html, SanitizeHtml, Transform

### Community 71 - "Community 71"
Cohesion: 0.40
Nodes (4): name, packageManager, private, version

### Community 77 - "Community 77"
Cohesion: 0.67
Nodes (3): PrismaClientBaseOptions, PrismaClientOptionsWithAccelerateUrl, PrismaClientOptionsWithAdapter

## Knowledge Gaps
- **1629 isolated node(s):** `BadanPengurusPageProps`, `metadata`, `SearchParams`, `metadata`, `SearchParams` (+1624 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2005 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PendetaDelegate` connect `Community 39` to `Pendeta Model`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `PrismaClient` connect `Prisma Client Class` to `Prisma Namespace Types`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `JemaatDelegate` connect `Community 34` to `Jemaat Model`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `BadanPengurusPageProps`, `metadata`, `SearchParams` to the rest of the system?**
  _1629 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prisma Namespace Types` be split into smaller, more focused modules?**
  _Cohesion score 0.014598540145985401 - nodes in this community are weakly interconnected._
- **Should `Ibadah Model` be split into smaller, more focused modules?**
  _Cohesion score 0.014705882352941176 - nodes in this community are weakly interconnected._
- **Should `Jemaat Model` be split into smaller, more focused modules?**
  _Cohesion score 0.015151515151515152 - nodes in this community are weakly interconnected._