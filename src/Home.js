import { useRef, useState } from "react";
import Markdown from "react-markdown";
import { Prism } from 'react-syntax-highlighter';
import Dropdown from './Dropdown';
import { get_file_ext, make_text_query, get_obj_url, fetch_txt } from "./utils";
import { ELEMENT, SUFFIXES, TEXT_BASED_SUFFIXES } from "./consts";
import "./app.css";


function Home() {
  const inputRef = useRef(null);  // ref to query text input
  const videoRef = useRef(null);  // ref to video player
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);  // store query results
  const [expanded, setExpanded] = useState(null);  // expand doc on click
  const [exclude, setExclude] = useState([]);

  async function expand(doc) {
    // lazy fetch text-based data
    doc = structuredClone(doc);
    if (TEXT_BASED_SUFFIXES.includes(doc.doc_suffix))
      doc.text = await fetch_txt(doc.doc_key)
    for (const chunk of doc.chunks) {
      const ext = get_file_ext(chunk.key);
      if (TEXT_BASED_SUFFIXES.includes(ext))
        chunk.text = (await (fetch_txt(chunk.key))).trim();
    }
    setExpanded(doc);
  }

  async function send_query() {
      const text = inputRef.current.value;
      if (!text) return;
      setResults([]);
      setLoading(true);
      const docs = await make_text_query(text, exclude);
      setResults(docs);
      setLoading(false);
  }

  return (
    <div className="App">
      {/* Query Box */}
      <section class="query-container">
        <input class="query-input" type="text" ref={inputRef} placeholder="Search" />
        <button class="query-btn" onClick={send_query}>&#8981;</button>
        <Dropdown 
          options={Object.values(ELEMENT)} 
          selected={exclude}
          setSelected={setExclude}
        />
      </section>

      {/* Expanded Doc */}
      <div class="expanded-container" style={{"max-height": expanded ? "100%" : 0}}>
        <button class="expanded-close-btn" onClick={() => setExpanded(null)}>X</button>
        <div class="expanded-filename">{expanded?.doc_filename}</div>
        <div class="expanded-inner-container">
            {
              expanded === null ? <></> :
              SUFFIXES.PY_SUFFIXES.includes(expanded.doc_suffix) ? (
                <div class="expanded-content-container">
                  <div class="expanded-content expanded-text">
                    <Prism 
                      language="python"
                      codeTagProps={{
                        style: {
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }
                      }}
                    >{expanded.text}</Prism>
                  </div>
                  <div class="row-chunks">
                    {expanded.chunks.map((chunk, i) => (
                      <a class="chunk">
                        <Prism 
                          language="python" 
                          class="chunk-code"
                          codeTagProps={{
                            style: {
                              wordBreak: "break-word",
                              whiteSpace: "pre-wrap",
                            }
                          }}>{chunk.text}</Prism>
                      </a>
                    ))}
                  </div>
                </div>
              ) : SUFFIXES.MD_SUFFIXES.includes(expanded.doc_suffix) ? (
                  <div class="expanded-content-container">
                    <div class="expanded-content expanded-text">
                      <Markdown>{expanded.text}</Markdown>
                    </div>
                    <div class="row-chunks">
                        {expanded.chunks.map((chunk, i) => (
                          <a class="chunk"><pre class="chunk-text">{chunk.text}</pre></a>
                          
                        ))}
                    </div>
                  </div>
              ) : SUFFIXES.IMG_SUFFIXES.includes(expanded.doc_suffix) ? (
                <img class="expanded-image" src={get_obj_url(expanded.doc_key)}/>
              ) : SUFFIXES.VID_SUFFIXES.includes(expanded.doc_suffix) ? (
                <div class="expanded-content-container">
                  <video 
                    class="expanded-content"
                    ref={videoRef}
                    src={get_obj_url(expanded.doc_key)} 
                    controls={true}>  
                  </video>
                  <div class="row-chunks">
                      {
                        expanded.chunks.map(chunk => (
                          <div class="chunk">
                            <img 
                              class="chunk-thumb" 
                              src={get_obj_url(chunk.key)}
                              onClick={() => videoRef.current.currentTime = parseFloat(chunk.meta["ELEM-FRAME-SECONDS"])}
                            />
                            <span class="chunk-meta">{
                              Math.floor(parseFloat(chunk.meta["ELEM-FRAME-SECONDS"]) / 60).toString() 
                              + ":" 
                              + Math.round(parseFloat(chunk.meta["ELEM-FRAME-SECONDS"]) % 60).toString().padStart(2, '0')}</span>
                          </div>
                        ))
                      }
                  </div>
                </div>
              ) : SUFFIXES.PDF_SUFFIXES.includes(expanded.doc_suffix) ? (
                <div class="expanded-content-container">
                  <object data={get_obj_url(expanded.doc_key)}
                          type='application/pdf' 
                          width='100%' height='100%'>
                  </object>
                  <div class="row-chunks">
                    {
                      expanded.chunks.map((chunk, i) => get_file_ext(chunk.key) === ".txt" ? (
                        <div class="chunk">
                          <pre class="chunk-text">{chunk.text}</pre>
                          <span class="chunk-meta chunk-extra-btm-padding">{"Page " + chunk.meta["ELEM-PAGE"]}</span>
                        </div>
                      ) : (
                        <div class="chunk">
                          <img class="chunk-thumb" src={get_obj_url(chunk.key)}/>
                          <span class="chunk-meta chunk-extra-btm-padding">{"Page " + chunk.meta["ELEM-PAGE"]}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <p>Unrecognized doctype [{expanded.doctype}]</p>
              )
            }
        </div>
      </div>

      {/* Results Grid */}
      <div class="grid">
        {
          // loading spinner
          loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )
        }
        {
          // filter presented results depending on nav tab
          results.map(doc => (
            <div class="doc" title={doc.doc_filename} onClick={() => expand(doc)}>
                <div class="doc-header">
                  <div class="doc-icon">
                  {
                    // doc icon
                    SUFFIXES.IMG_SUFFIXES.includes(doc.doc_suffix) ? (
                      <i class="icon-orange fa-solid fa-file-image"></i>
                    ) : SUFFIXES.TXT_SUFFIXES.includes(doc.doc_suffix) ? (
                      <i class="icon-blue fa-solid fa-file-lines"></i>
                    ) : SUFFIXES.VID_SUFFIXES.includes(doc.doc_suffix) ? (
                      <i class="icon-red fa-solid fa-film"></i>
                    ) : SUFFIXES.PDF_SUFFIXES.includes(doc.doc_suffix) ? (
                      <i class="icon-red fa-solid fa-file-pdf"></i>
                    ) : SUFFIXES.MD_SUFFIXES.includes(doc.doc_suffix) ? (
                      <i class="icon-blue fa-brands fa-markdown"></i>
                    ) : SUFFIXES.PY_SUFFIXES.includes(doc.doc_suffix) ? (
                      <i class="icon-orange fa-brands fa-python"></i>
                    ) : <></>
                  }
                  </div>
                  <div class="doc-filename">{doc.doc_filename}</div>
                </div>
                <div class="doc-thumb-container">
                  <img class="doc-thumb" src={get_obj_url(doc.doc_thumb_key)}/>
                </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default Home;
