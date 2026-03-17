"use client"

import { useEffect } from "react"
import { supabase } from "../lib/supabase"

export default function Home() {

useEffect(() => {

async function cargarClientes() {

const { data, error } = await supabase
.from("clients")
.select("*")

console.log("DATOS:", data)
console.log("ERROR:", error)

}

cargarClientes()

}, [])

return (
<div style={{padding:40}}>
<h1>APP DE PRÉSTAMOS</h1>
<p>Probando conexión con Supabase...</p>
</div>
)

}