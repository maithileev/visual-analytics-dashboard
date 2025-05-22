import type { PageLoad } from './$types';
import Papa from 'papaparse';
import { base } from '$app/paths';

export async function load({ fetch, params }) {

    const responseCSV = await fetch(base + '/KLweather2018.csv', {headers: {'Content-Type': 'text/csv'}})
 
    let textCSV = await responseCSV.text()
    let parsedCSV = Papa.parse(textCSV, {header: true})
    console.log(typeof(parsedCSV))

    return { 
      parsedCSV 
    }
  }
  