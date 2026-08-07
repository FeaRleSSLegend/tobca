// components/ui/brandSwooshPaths.ts
// AUTO-EXTRACTED from assets/brand-logo.svg — do not hand-edit.
//
// The logo is a TRACED vector, so neither swoosh is a single path: each one is
// a stack of translucent layers that together produce its gradient and its
// anti-aliased edge. The pink swoosh is 5 layers ramping to #fd0169, the
// purple 3 layers ramping to #cb24f8. They were isolated by parsing every
// path's real bounding box (all commands are RELATIVE — m/l/h/v/z — so a naive
// coordinate read gives garbage) and keeping only those lying entirely in the
// mark's top band, above the "OLIVEBROOK CHURCH" wordmark.
//
// Coordinates are in the source file's own space (viewBox 0 0 768 273), so the
// two groups stay in correct registration with each other.

export interface SwooshLayer {
  d: string;
  fill: string;
  opacity: number;
}

// Tight bounds of both groups together, used as the loader's viewBox.
export const SWOOSH_VIEWBOX = { x: 195, y: 0, width: 460, height: 116 };

export const PINK_SWOOSH: SwooshLayer[] = [
  {
    "d": "m510 8v-1h24v1h-7-11zm-7 1l4-1v1zm-13 1l6-1v1zm56 0v-1l3 1zm-77 3l2-1v1zm-30 6l2-1v1zm80 10v-1h3zm40-1h1v1h-1zm-49 2v-1h2zm-9 1v-1h3zm74 0l-2-1h2zm-81 0h1v1h-1zm-5 1h1v1h-1zm93 0h1v1h-1zm-99 2v-1h1 1zm102-1h1v1h-1zm-118 3h1v1h-1zm127 0h1v1h-1zm-134 2v-1h2zm137-1h1v1h-1zm-140 2v-1h1 1zm-5 0h1v1h-1zm-5 1h1v1h-1zm157 0h1v1h-1zm-161 1h1v1h-1zm-9 2h1v1h-1zm-4 1h1v1h-1zm-4 1h1v1h-1zm-5 1h1v1h-1zm-4 2v-1h2zm-5 0h1v1h-1zm-3 1h1v1h-1zm-5 2v-1h2zm-8 1h1v1h-1zm-4 1h1v1h-1zm-5 1h1v1h-1zm-4 1h1v1h-1zm-4 1h1v1h-1zm-6 1h1v1h-1zm-4 2v-1h2zm-3 0h1v1h-1zm-6 1h1v1h-1zm-4 1h1v1h-1zm-14 3h1v1h-1zm-5 1h1v1h-1zm-6 1h1v1h-1zm-5 2v-1h2zm-122 0h1v1h-1zm117 0h1v1h-1zm-62 2l2-1v1zm58-1h1v1h-1zm-5 1h1v1h-1zm-102 1h1v1h-1zm95 0h1v1h-1zm-90 2h1v1h-1zm79 0h1v1h-1zm-73 2l-2-1h2zm63 0v-1h1 1zm-61 0h1v1h-1zm57 0h1v1h-1zm-50 1h1v1h-1zm38 0h1v1h-1z",
    "fill": "#ed96e2",
    "opacity": 0.14
  },
  {
    "d": "m537 8h1v1h-1zm-41 1h1v1h-1zm48 1v-1h2v1zm-61 1l6-1v1h-1zm67-1h1v1h-1zm-72 1h1v1h-1zm76 0h1v1h-1zm-83 2v-1h3v1h-2zm86 0v-1h2v1h-1zm-92 1l3-1v1zm96 0v-1l2 1h-1zm-106 1h1v1h-1zm-5 1h1v1h-1zm120 0h1v1h-1zm-125 1h1v1h-1zm128 0h1v1h-1zm-132 1h1v1h-1zm134 0h1v1h-1zm-143 3v-1h2v1zm-4 1v-1h2v1h-1zm-8 2v-1h2v1h-1zm167 0h1v1h-1zm-178 3v-1h2v1h-1zm-4 1l2-1v1zm122 0v-1h3 17 7v1zm-11 1v-1h3v1zm44 0v-1h4v1zm-162 1v-1h2v1zm108 0v-1h1 3v1zm65 0l-4-1h3 1zm-176 1l2-1v1h-1zm104 0v-1h2v1zm76-1h1v1h-1zm-183 1h1v1h-1zm101 0h1v1h-1zm86 0h1v1h-1zm-190 2v-1h2v1h-1zm97 0v-1h1 2v1zm97-1h1v1h-1zm-198 2l2-1v1h-1zm94 0v-1h2 2v1zm107 0v-1h1 1v1zm-110 0h1v1h-1zm113 0h1v1h-1zm-210 2l2-1v1h-1zm90 0v-1h1 3zm123-1h1v1h-1zm-216 2l2-1v1zm89 0v-1h2v1zm130-1h1v1h-1zm-223 2l2-1v1zm-2 0h1v1h-1zm85 1v-1h1 1v1zm144-1h1v1h-1zm5 1v-1l1 1v1h-1zm-237 0h1v1h-1zm84 0h1v1h-1zm151 0h1v1h-1zm-239 2l2-1v1zm83-1h1v1h-1zm-86 2l2-1v1zm82-1h1v1h-1zm-84 1h1v1h-1zm80 1v-1h2zm-84 1v-1h2v1h-1zm79-1h1v1h-1zm-82 2v-1h2v1zm77 0v-1h1 1v1zm-4 1v-1h2v1zm-79 0h1v1h-1zm75 0h1v1h-1zm-78 2v-1h2v1h-1zm73 0v-1h2v1zm-76 0h1v1h-1zm-3 2v-1h2v1h-1zm71 0v-1h1 1v1zm-75 1l2-1v1h-1zm71-1h1v1h-1zm-77 3v-1h2v1h-1zm69-1h1v1h-1zm-72 2l2-1v1h-1zm67 0v-1h2v1zm-70 0h1v1h-1zm66 0h1v1h-1zm-69 1h1v1h-1zm64 1v-1h2v1zm-68 1l2-1v1h-1zm64 0v-1h2v1zm-67 1l2-1v1zm-3 1v-1h2v1h-1zm61-1h1v1h-1zm-64 1h1v1h-1zm60 1v-1h2v1zm-65 1l2-1v1zm60-1h1v1h-1zm-63 1h1v1h-1zm58 1v-1h1 1v1zm-4 1v-1h1 1zm-61 0h1v1h-1zm56 1v-1h2zm-61 1v-1h2v1zm56 0v-1h1 1v1zm-4 0h1v1h-1zm-133 2v-1l3 1v1h-1-1zm73 0v-1h2v1h-1zm54-1h1v1h-1zm-59 2l3-1v1h-2zm54-1h1v1h-1zm-58 1h1v1h-1zm-56 2l-1-1h2v1zm50 0v-1h2v1zm52 0v-1h2 2v1zm-105 0h1v1h-1zm6 1v-1l3 1zm41 0v-1h2v1h-1zm53 0v-1h1 3v1zm-4 0h1v1h-1zm-8 2v-1h3 2zm-80 1v-1h2v1zm73 0v-1h5v1zm-6 0h1v1h-1zm-59 2v-1h3v1zm51 0v-1h5v1zm-44 1v-1h3v1zm33 0v-1h4v1zm5-1h1v1h-1z",
    "fill": "#e275ce",
    "opacity": 0.4
  },
  {
    "d": "m507 9v-1h3 6v1h-6zm20 0v-1h7 3v1h-5zm-30 0h1v1h-1zm46 0h1v1h-1zm6 1h1v1h-1zm-70 2v-1h3v1h-1zm74-1h1v1h-1zm-79 1h1v1h-1zm82 0h1v1h-1zm-88 1h1v1h-1zm92 0h1v1h-1zm-100 2v-1h4v1h-3zm104-1h1v1h-1zm-108 2v-1h2v1zm111-1h1v1h-1zm-116 2v-1h2v1zm-5 1v-1h2v1h-1zm126-1h1v1h-1zm-130 2v-1h2v1zm-4 0h1v1h-1zm139 0h1v1h-1zm-143 1h1v1h-1zm145 0h1v1h-1zm-149 1h1v1h-1zm151 0h1v1h-1zm-156 2v-1h2v1zm158-1h1v1h-1zm-161 1h1v1h-1zm163 0h1v1h-1zm-168 2v-1h2v1zm-3 0h1v1h-1zm174 0h1v1h-1zm2 1h1v1h-1zm-183 1h1v1h-1zm118 1v-1h2v1zm29 0v-1h2v1zm-151 0h1v1h-1zm111 1v-1h1 1v1zm50 0v-1h1 1v1zm-164 0h1v1h-1zm105 0h1v1h-1zm66 0h1v1h-1zm23 0h1v1h-1zm-96 1h1v1h-1zm78 0h1v1h-1zm-183 1h1v1h-1zm99 0h1v1h-1zm88 0h1v1h-1zm-96 2v-1h2v1h-1zm100-1h1v1h-1zm-106 1h1v1h-1zm110 0h1v1h-1zm-205 2v-1h2v1zm90 0v-1h3v1zm117 0v-1h2v1zm10-1h1v1h-1zm-132 1h1v1h-1zm125 0h1v1h-1zm8 0h1v1h-1zm-138 2v-1h2v1zm133-1h1v1h-1zm-222 1h1v1h-1zm84 1v-1h2v1h-1zm140-1h1v1h-1zm-227 1h1v1h-1zm83 0h1v1h-1zm146 0h1v1h-1zm-151 2v-1h2v1zm154-1h1v1h-1zm-238 1h1v1h-1zm80 0h1v1h-1zm-83 1h1v1h-1zm78 1v-1h2v1zm-81 0h1v1h-1zm77 1v-1h2v1zm-80 0h1v1h-1zm76 0h1v1h-1zm-5 1h1v1h-1zm-78 1h1v1h-1zm74 0h1v1h-1zm-77 1h1v1h-1zm73 0h1v1h-1zm-79 2h1v1h-1zm71 0h1v1h-1zm-5 1h1v1h-1zm-72 1h1v1h-1zm68 0h1v1h-1zm-72 2v-1h2v1zm68-1h1v1h-1zm-70 1h1v1h-1zm66 0h1v1h-1zm-5 1h1v1h-1zm-68 1h1v1h-1zm63 1v-1h2v1zm-66 0h1v1h-1zm62 0h1v1h-1zm-4 1h1v1h-1zm-64 1h1v1h-1zm60 0h1v1h-1zm-5 1h1v1h-1zm-62 1h1v1h-1zm57 1v-1h2v1zm-61 1v-1h2v1zm56 0v-1h2v1zm-60 1v-1h2v1zm56-1h1v1h-1zm-59 1h1v1h-1zm54 1v-1h2v1zm-58 1v-1h2v1zm54-1h1v1h-1zm-58 2v-1h2v1zm53-1h1v1h-1zm-58 2v-1h2v1h-1zm53 0v-1h1 1v1zm-56 0h1v1h-1zm51 0h1v1h-1zm-55 1h1v1h-1zm-69 2v-1h1 1l2 1-1 1h-1l-1-1zm63 0v-1h3v1zm51 0v-1h1 1v1zm-110 1v-1h1l1 1v1h-1-1zm54 0v-1h3v1zm49-1h1v1h-1zm-99 1h1v1h-1zm44 0h1v1h-1zm50 0h1v1h-1zm-96 2v-1h2v1zm10 0l-2-1h2zm27 0v-1h3v1h-2zm53 0v-1h3v1zm-6 0h1v1h-1zm-7 1h1v1h-1zm-67 2v-1l2 1zm60 0v-1h2v1zm-10 1v-1h3 1v1zm-37 1v-1l2 1zm25 0v-1h5v1z",
    "fill": "#d25fbd",
    "opacity": 0.64
  },
  {
    "d": "m516 9v-1h11v1zm-18 1v-1h5 4 3zm45 0l-11-1h5 1 1 4zm-54 1v-1h1 6 1zm60 0l-5-1h2 3zm-67 1v-1h1 5zm71 0l-3-1h1 1 1zm-78 1v-1h2 1 1 2zm81 0l-2-1h1 1zm-87 1v-1h2 1zm91 0l-2-1h1 1zm-96 0h1v1h-1zm100 1l-2-1h1 1zm-106 1v-1h1 1 1zm109 0l-2-1h1 1zm-114 1v-1h1 1 1zm117 0l-3-1h1 1 1zm-122 1v-1h1 1 1zm123-1h1v1h-1zm-127 2v-1h1 1 1zm131 0l-2-1h1 1zm-136 1v-1h2 1zm138 0l-2-1h1 1zm-142 0h1v1h-1zm143 0h1v1h-1zm-147 2v-1h1 2zm150 0l-2-1h1 1zm-154 1v-1h1 1zm155-1h1v1h-1zm-159 1h1v1h-1zm161 0h1v1h-1zm-165 2v-1h1 1zm168 0l-2-1h1 1zm-172 1v-1h1 1zm172-1h1v1h-1zm-176 2v-1h2zm178-1h1v1h-1zm-181 2v-1h1 1zm107 0l10-1v1h-3-3-3zm41 0v-1l9 1h-1-4-1zm36 0l-2-1h1 1zm-188 1v-1h1 2zm103 0l7-1v1h-2-2zm59 0v-1l4 1h-3zm26-1h1v1h-1zm-191 2v-1h1 1zm98 0l6-1v1h-1-3zm73 0v-1l4 1h-1-2zm21-1h1v1h-1zm-196 2v-1h1 2zm96 0l5-1v1h-3-1zm84 0v-1l3 1h-1zm18-1h1v1h-1zm-201 2v-1h1 1zm93 0l5-1v1h-2-1zm94 0v-1l3 1h-1-1zm15-1h1v1h-1zm-205 2v-1h1 1zm90 0l3-1v1h-1zm104 0v-1l2 1h-1zm12-1h1v1h-1zm-210 2v-1h1 1 1zm211-1h1v1h-1zm-213 1h1v1h-1zm85 1l3-1v1zm129-1h1v1h-1zm-218 2v-1h1 1zm84 0l3-1v1h-1zm129 0v-1l2 1h-1zm6-1h1v1h-1zm-222 2v-1h1 1zm223-1h1v1h-1zm-226 1h1v1h-1zm81 1l2-1v1h-1zm143 0v-1h2v1h-1zm2 0l1-1h1l1 1v1h-1-1-1zm-229 1v-1h2zm79 0l3-1v1h-1-1zm-83 1v-1h1 1 1zm79 0l2-1v1h-1zm-81 1v-1h1 1zm76 0l3-1v1h-1-1zm-79 1v-1h2zm75 0l2-1v1zm-78 1v-1h2zm74 0l2-1v1h-1zm-77 0h1v1h-1zm72 1l3-1v1h-1-1zm-76 1v-1h1 1zm71 0l3-1v1h-1zm-74 1v-1h1 2zm70 0l3-1v1h-1-1zm-73 0h1v1h-1zm70 1l2-1v1zm-73 1v-1h1 1zm68 0l3-1v1h-2zm-71 1v-1h1 1zm67 0l3-1v1h-1-1zm-70 1v-1h1 1zm65 0l3-1v1h-2zm-68 1v-1h1 1zm65 0l2-1v1zm-68 0h1v1h-1zm63 1l3-1v1h-1-1zm-66 0h1v1h-1zm61 1l4-1v1h-1-1zm-65 1v-1h1 1zm62 0l2-1v1h-1zm-65 1v-1h1 1zm59 0l3-1v1h-1zm-62 1v-1h1 1zm58 0l3-1v1h-1zm-62 1v-1h1 1 1zm-2 0h1v1h-1zm56 1l3-1v1h-1zm-60 1v-1h1 2zm55 0l3-1v1h-1zm-58 1v-1h1 1zm54 0l2-1v1h-1zm-57 0h1v1h-1zm52 1l2-1v1h-1zm-56 1v-1h2zm52 0l2-1v1h-1zm-56 1v-1h1 1zm-3 0h1v1h-1zm49 1l3-1v1h-1-1zm-53 1v-1h1 1zm47 0l4-1v1h-1-1-1zm-52 1v-1h1 2zm48 0l3-1v1h-2zm-52 1v-1h1 1 1zm47 0l3-1v1h-1zm-51 1v-1h1 1zm45 0l5-1v1h-3-1zm-49 0h1v1h-1zm44 1l4-1v1h-1-1zm-49 1v-1h1 1zm43 0l3-1v1zm-98 1v-1h1 1v1zm47 0v-1h1 2 2zm46 0l3-1v1h-1-1zm-91 1v-1h1 3 2l2 1h1 25 1 1l-9 1-2 2 2 1h19v1h-23l-2-1h-3-1-2l-1-1h-3-1l-2-1h-2l-1-1h-2-1zm38 0v-1h3 1 1zm48 0l2-1v1zm-10 1l6-1v1h-1zm-4 1l3-1v1h-2zm-11 1l7-1v1h-1-5zm-10 1l7-1v1h-1-1-1z",
    "fill": "#e42374",
    "opacity": 0.93
  },
  {
    "d": "m498 10l12-1h6 11 5l11 1h1l5 1h1l3 1h1l2 1h1 1l2 1h1 1l2 1h1l2 1 3 1h1l1 1h1l2 1 2 1h1l1 1 2 1h1l1 1h1l1 1 2 1 1 1h1l1 1 2 1 1 1 1 1h1l1 1 1 1 1 1 1 1 1 1 1 1v1h-2-1l-1-1h-1l-2-1h-1l-1-1h-2l-1-1h-1-1l-2-1h-1l-3-1h-1l-3-1h-1l-4-1h-1-1l-4-1h-1l-9-1h-2-7-17-3-2l-10 1h-1l-7 1h-1-1l-6 1h-1l-5 1h-1l-5 1h-1-2l-3 1h-2-1l-1 1h-1-3l-3 1h-1-1l-3 1h-2l-1 1h-2-2l-2 1h-1-1l-3 1h-2l-2 1h-1-1l-3 1h-2l-2 1h-2l-2 1h-1-1l-3 1h-1-1l-3 1h-1l-3 1h-1l-2 1h-2l-3 1h-1l-3 1h-1-1l-3 1h-1l-2 1h-1-1l-3 1h-1l-4 1h-1l-2 1h-1-2l-3 1h-1l-3 1h-1l-1 1h-1-1-1l-3 1h-1-1l-3 1h-2l-2 1h-1-2l-2 1h-1-1l-2 1h-1-2l-1 1h-2-1l-3 1h-1-1l-4 1h-1l-3 1h-1-1l-3 1h-1l-5 1h-1l-4 1h-2-1l-3 1h-1-1l-3 1h-3l-2 1h-3-1l-6 1h-1l-3 1h-1-1-2l-7 1h-3l-7 1h-5-19l-2-1 2-2 9-1h2l5-1h1 1l5-1h3l2-1h3l1-1h2 1l2-1h1 1l3-1h1l3-1h2l2-1h2l1-1h1 1l2-1h2l2-1h2l1-1h1 1l2-1h1l3-1h1l1-1h1l3-1h1l2-1h1l2-1h1l2-1h1 1l1-1h2l1-1h1 1l2-1h1l2-1h1l2-1h1l2-1h1l1-1h1 1l3-1 2-1h1 1l1-1h1 1l2-1h1l2-1h1l2-1 3-1h1l2-1h1l1-1h2l2-1h1l2-1h2l1-1h1l3-1h1l2-1h1l2-1h1l3-1h1l2-1h1l3-1h1l2-1h1l2-1h1 1l2-1h2l2-1h1 1l1-1h1 2l2-1h1 1l3-1h1l1-1h1 1 1l3-1h2l3-1h1l3-1h2l3-1h2l3-1h3l1-1h3 1l3-1h2 1l6-1h1l6-1h1l8-1zm103 27h1v1h-1z",
    "fill": "#fd0169",
    "opacity": 1.0
  }
];

export const PURPLE_SWOOSH: SwooshLayer[] = [
  {
    "d": "m565 14h1v1h-1zm-128 5h1v1h-1zm141 0h1v1h-1zm2 1h1v1h-1zm2 1h1v1h-1zm-158 1h1v1h-1zm162 1h1v1h-1zm-170 1h1v1h-1zm-3 1h1v1h-1zm179 2h1v1h-1zm-190 1h1v1h-1zm191 0h1v1h-1zm3 2h1v1h-1zm1 1h1v1h-1zm1 1h1v1h-1zm1 1h1v1h-1zm-217 1h1v1h-1zm220 2h1v1h-1zm1 1h1v1h-1zm-255 8h1v1h-1zm164 4v-1h10v1zm49-1h1v1h-1zm-55 2v-1h3v1zm62 0v-1h3v1zm-75 1v-1h5v1zm82 0v-1h2v1zm-89 1v-1h2v1zm94-1h1v1h-1zm-101 2v-1h4v1zm104-1h1v1h-1zm-111 2v-1h2zm-7 1v-1h2v1zm126-1h1v1h-1zm-131 1h1v1h-1zm134 0h1v1h-1zm-139 1h1v1h-1zm142 0h1v1h-1zm-148 2v-1h2v1zm151-1h1v1h-1zm-155 1h1v1h-1zm157 0h1v1h-1zm-162 1h1v1h-1zm164 0h1v1h-1zm-171 2v-1h3v1zm174-1h1v1h-1zm-178 2v-1h2v1zm180-1h1v1h-1zm-316 1h1v1h-1zm132 0h1v1h-1zm186 0h1v1h-1zm-191 2v-1h2v1zm193-1h1v1h-1zm-196 1h1v1h-1zm198 0h1v1h-1zm-203 1h1v1h-1zm-5 2v-1h3zm211-1h1v1h-1zm-214 2v-1h2zm-4 0h1v1h-1zm147 1v-1h20v1zm-341 0h1v1h-1zm189 1v-1h2v1zm131 0l7-1v1zm54 0v-1h6v1zm43-1h1v1h-1zm-231 1h1v1h-1zm122 1v-1h7v1zm76 0v-1h3v1zm34-1h1v1h-1zm-403 1h1v1h-1zm26 0h1v1h-1zm140 0h1v1h-1zm120 1v-1h3v1zm90-1h1v1h-1zm-213 1h1v1h-1zm113 1l4-1v1zm104 0v-1h2v1zm26-1h1v1h-1zm-247 1h1v1h-1zm109 1l4-1v1zm116 0v-1l3 1zm23-1h1v1h-1zm-252 1h1v1h-1zm108 0h1v1h-1zm125 0h1v1h-1zm20 0h1v1h-1zm-256 1h1v1h-1zm103 1v-1h2v1zm136 0v-1h2v1zm18-1h1v1h-1zm-262 1h1v1h-1zm101 1v-1h2v1zm146 0v-1h2v1zm16-1h1v1h-1zm-268 2l3-1v1zm101-1h1v1h-1zm154 0h1v1h-1zm-257 2v-1h2zm96-1h1v1h-1zm176 0h1v1h-1zm-276 1h1v1h-1zm92 1v-1h4v1zm174-1h1v1h-1zm11 0h1v1h-1zm-282 2v-1h3v1zm92-1h1v1h-1zm181 0h1v1h-1zm-276 1h1v1h-1zm87 1v-1h4v1zm191-1h1v1h-1zm9 0h1v1h-1zm-291 1h1v1h-1zm85 1v-1h4zm207-1h1v1h-1zm-296 2v-1h2v1zm83-1h1v1h-1zm-86 1h1v1h-1zm79 0h1v1h-1zm-84 1h1v1h-1zm79 1v-1h2v1zm222-1h1v1h-1zm5 0h1v1h-1zm-311 2l3-1v1zm76 0v-1h2v1zm-79 1v-1h2v1zm74-1h1v1h-1zm238 0h1v1h-1zm-316 1h1v1h-1zm72 0h1v1h-1zm248 0h1v1h-1zm-324 2v-1h2v1zm67 0l4-1v1zm-71 0h1v1h-1zm65 1v-1h2v1zm-70 0h1v1h-1zm63 1v-1h3v1zm-66 0h1v1h-1zm60 1l2-1v1zm-7 1l2-1v1zm-63 0h1v1h-1zm58 0h1v1h-1zm-62 2v-1h2v1zm53 0v-1h3v1zm-59 1v-1h2v1zm52 0v-1h4v1zm-58 1l3-1v1zm53-1h1v1h-1zm-57 2v-1h2v1zm49 0v-1h2v1zm-54 1v-1h2v1zm45 0v-1h5v1zm-53 1v-1h2v1zm46-1h1v1h-1zm-52 2v-1h2v1zm43-1h1v1h-1zm-51 1h1v1h-1zm41 1v-1h7v1zm-57 1l8-1v1h-3-2-1zm48-1h1v1h-1zm-53 2v-1h5v1zm42-1h1v1h-1zm-34 2v-1h2 4v1zm17 0v-1h4v1z",
    "fill": "#e275ce",
    "opacity": 0.4
  },
  {
    "d": "m522 49l3-1h1 25l10 1h1 2 2l2 1h3 3l1 1h2 1l2 1h1 1l1 1h1 2 1l1 1h1l2 1h1l2 1h1 1l1 1h1 1l1 1h1l1 1h1 1l1 1h1l1 1h1l1 1h1l1 1h1l1 1h1l1 1h1l1 1h1l1 1h1l1 1 1 1 1 1h1l1 1 1 1 1 1h1l1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1v1l1 1 1 1 1 1 1 1v1 1h-1l-1-1h-1l-1-1-1-1h-1l-1-1h-1l-1-1h-1l-1-1-1-1h-1l-1-1h-1l-1-1h-1-1l-1-1h-1l-1-1h-1l-1-1h-2l-1-1h-2l-2-1h-1-1l-3-1h-1l-1-1h-2-1l-2-1h-1-1-1l-2-1h-3-2-1l-1-1h-6l-13-1h-20l-13 1h-1l-7 1h-3-2-7l-2 1h-1-1-3l-3 1h-3l-4 1h-1-3l-4 1h-3-1-1l-4 1h-2-2l-3 1h-2-2l-3 1h-1-1l-5 1h-1-1l-2 1h-2-4l-1 1h-1-2-1l-2 1h-1-1-4l-2 1h-4l-2 1h-3-1l-1 1h-1-1-3-1l-2 1h-1-2l-4 1h-1-1-2l-1 1h-2-1-1l-4 1h-1-1l-4 1h-1l-4 1h-1-3-2l-1 1h-2-1-3l-2 1h-2l-2 1h-1-4l-2 1h-3-1-1l-5 1h-1-3l-1 1h-2-4l-2 1h-1-1-1l-5 1h-1-2l-3 1h-1-5l-2 1h-1-3-1l-2 1h-1-5-1l-2 1h-1-7l-3 1h-2-3-1l-4 1h-2-1-1-2-1l-12 1h-1-4-11-4v-1h3l2-1h5 1 1l3-1h4 2l3-1h1 2l4-1h1 1 2l1-1h2 2l2-1h3l2-1h1 2l1-1h1 1 1 2l1-1h1 1l2-1h1 2l1-1h2 1 1l1-1h1 1l3-1h1 1l1-1h2 2l1-1h1 1l3-1h2l1-1h3l1-1h1 1l3-1h1 1l1-1h1 2l1-1h1 1l2-1h1 1l2-1h3l1-1h1 1l1-1h2l2-1h3l1-1h1 1l1-1h1 2 1l1-1h1 1l3-1h1l1-1h1 1 1l2-1h1l3-1h1 1l1-1h1 2l1-1h1 1 1l2-1h1l2-1h1l3-1h1 1 1l3-1h1 1l1-1h1 2l2-1h1 1l3-1h2l1-1h1 3l1-1h3 1l1-1h1 2 1l1-1h1 1 2l1-1h2 1 1l1-1h2 1 1l3-1h1 2l4-1h1l2-1h3 2 4l2-1h1 2l4-1h1 5l1-1h7 3l1-1h1 1zm118 39h1v1h-1zm-406 16h1v1h-1z",
    "fill": "#cb24f8",
    "opacity": 0.99
  },
  {
    "d": "m621 78h1v1h-1zm8 4h1v1h-1z",
    "fill": "#e275ce",
    "opacity": 0.4
  }
];

