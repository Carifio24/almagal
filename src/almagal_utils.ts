/* eslint-disable @typescript-eslint/naming-convention */
import _almagalSources from "./assets/almagal_sources.json";
// rename the keys to be more friendly, from R.A. to ra, and Dec. to dec

// almagal sources to ignore by iid
const _ignore = [
  'G348.7342-01.0359B', // overlapping
  'G323.7410-00.2552C', // overlapping
  '615590', // overlapping
  '653755', // WR
];

function hmsToDegrees(hms: string): number {
  const [h, m, s] = hms.split(":").map(Number);
  return (h + m / 60 + s / 3600) * 15; // convert hours to degrees
}
function dmsToDegrees(dms: string): number {
  const [d, m, s] = dms.split(":").map(Number);
  const sign = d < 0 ? -1 : 1;
  return sign * (Math.abs(d) + m / 60 + s / 3600);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
_almagalSources.forEach((source: any) => {
  source.ra = hmsToDegrees(source["R.A."]);
  source.dec = dmsToDegrees(source["Dec."]);
  delete source["R.A."];
  delete source["Dec."];
});

export interface ALMAGalSource {
    iid:        string;
    aid:        string;
    orig_id:    string;
    glon:       number;
    glat:       number;
    dist_ag:    number;
    mass:       number;
    lum:        number;
    obs_sample: ObsSample;
    lm:         number;
    vlsr_ag:    number;
    edist_ag:   number;
    dist_flag:  DistFlag;
    tdust:      number;
    tbol:       number;
    vlsr19:     number;
    dist19:     number;
    fit_flag:   FitFlag;
    f70:        number;
    f160:       number;
    f250:       number;
    f350:       number;
    f500:       number;
    ra:         number;
    dec:         number;
    has_photo:  boolean;
    photo_url:  string;
    /* added for compatability with the almagalSourceList which has these
     * we will get rid of these eventually i think
     */
    type: string;
    included: boolean;
}

export enum DistFlag {
    CloudEXT = "CLOUD_EXT",
    Kdist = "KDIST",
    KdistGroup = "KDIST_GROUP",
    KdistIrdc = "KDIST_IRDC",
    Mdist = "MDIST",
    NoAmb = "NO_AMB",
    NoKda = "NO_KDA",
    SdistEXT = "SDIST_EXT",
    SdistGroup = "SDIST_GROUP",
    SoloDist = "SOLO_DIST",
    TgtPoint = "TGT_POINT",
}

export enum FitFlag {
    Empty = "-",
    NoProps = "no_props",
    Refit40K = "refit40K",
    SedIrr = "sed_irr",
    SedNoband = "sed_noband",
    SedRebuilt = "sed_rebuilt",
    SedSat = "sed_sat",
}

export enum ObsSample {
    Far = "far",
    Near = "near",
}



// an almgal source url is
// https://www.almagal.org/index.php?option=com_almagal&task=download.file&path=/${iid}/images/combined/7MTM2TM1/almagal/${iid}_cont_7MTM2TM1_jointdeconv.image.pbcor.fits"
export function getAlmagalSourceUrl(source: ALMAGalSource, pbcor = true): string {
  const baseUrl = "https://www.almagal.org/index.php?option=com_almagal&task=download.file&path=";
  const path = `/${source.iid}/images/combined/7MTM2TM1/almagal/${source.iid}_cont_7MTM2TM1_jointdeconv.image${pbcor ? ".pbcor" : ""}.fits`;
  return baseUrl + path;
}

export function getAlmagalSources(): ALMAGalSource[] {
  return _almagalSources.filter(source => !_ignore.includes(source.iid)) as unknown as ALMAGalSource[];
}

export const almagalSources = getAlmagalSources();

export function getAlmagalSourceById(iid: string): ALMAGalSource | undefined {
  return getAlmagalSources().find(source => source.iid === iid);
}

/** Look a source up by its ALMAGAL name (`aid`), e.g. "AG342.7054+0.1251". */
export function getAlmagalSourceByName(aid: string): ALMAGalSource | undefined {
  return getAlmagalSources().find(source => source.aid === aid);
}

export const formatSigFigs = (v: number, sigFigs = 3) =>
  Number.isFinite(v) ? Number(v.toPrecision(sigFigs)).toString() : String(v);
