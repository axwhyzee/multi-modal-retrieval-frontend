import { API_URL, USER, TOP_N } from "./consts";


export function get_obj_url(key) {
  return `${API_URL}/get/${key}`
}

export function get_file_ext(key) {
  return "." + key.split(".").pop().toLowerCase();
}

export async function fetch_txt(key) {
  const chunk_req = await fetch(get_obj_url(key));
  const blob = await chunk_req.blob();
  return await blob.text();
}

export async function make_text_query(text, exclude=null) {
  const params = new URLSearchParams({ text: text, user: USER, top_n: TOP_N, exclude_elems: exclude });
  const req = await fetch(`${API_URL}/query/text?${params}`)
  const docs = await req.json();
  for (let i=0; i<docs.length; i++) {
    docs[i].doc_suffix = get_file_ext(docs[i].doc_key);
  }
  return docs;
}

export async function list_objs() {
  const req = await fetch(`${API_URL}/list`)
  return await req.json();
}
