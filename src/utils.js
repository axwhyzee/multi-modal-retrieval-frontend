const API_URL = process.env.REACT_APP_API_URL;
const USER = process.env.REACT_APP_USER;
const TOP_N = 10;


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

export async function make_text_query(text) {
  const params = new URLSearchParams({ text: text, user: USER, top_n: TOP_N });
  const req = await fetch(`${API_URL}/query/text?${params}`)
  return await req.json();
}
