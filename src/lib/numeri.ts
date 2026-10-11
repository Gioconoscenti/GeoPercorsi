/** Numero all'italiana, con al massimo due decimali */
export const formatta = (v: number) => v.toLocaleString('it-IT', { maximumFractionDigits: 2 })

/** Numero con l'unità di misura ("4.806 m", "21 °C", "4,7 milioni") */
export const conUnita = (v: number, unita: string) => `${formatta(v)}${unita ? (unita.startsWith('°') || unita.startsWith('%') ? '' : ' ') + unita : ''}`
