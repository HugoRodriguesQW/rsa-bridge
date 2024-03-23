import Head from "next/head";
import React, { useEffect, useState } from "react";

import { ClientRSA } from "@hugorodriguesqw/rsa-bridge";

const rsa = new ClientRSA({ bits: 1024 });

export default function Home() {
  const statusOptions = ["disconnected", "connecting", "connected"];
  const [status, setStatus] = useState(0);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("")

  useEffect(() => {
    rsa.connect("http://localhost:3000/api/publickey");

    rsa.on("connecting", () => {
      setStatus(1);
    });

    rsa.on("connect", () => {
      setStatus(2);
    });
  }, []);

  function send() {
    console.info("> sending data");
    rsa
      .fetch("http://localhost:3000/api/hi", {
        body: JSON.stringify(input),
        method: "POST",
      })
      .then((response) => {
        console.info(response)
        setOutput(response)
      })
      .catch(console.warn);
  }

  return (
    <>
      <Head>
        <title>ReactJS Example | RSA Bridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <span style={styles.leftTopLabel}>
          RSA-Bridge - ReactJS Example - @HugoRodriguesQW
        </span>
        <div style={styles.content}>
          <h3>
            RSA status:{" "}
            <span
              style={{
                color: ["red", "gray", "green"][status],
              }}
            >
              {statusOptions[status]}
            </span>
          </h3>
        </div>

        <div>
          <p>Message: </p>
          <input
            placeholder="########"
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
          <button
            disabled={status === 0 || input === ""}
            onClick={send}
            style={{ marginLeft: "12px" }}
          >
            Send
          </button>
        </div>
        <div style={styles.contentBlock}>
          <p style={styles.resposeTitle}>
            Response:
            <span
              style={{ marginLeft: "10px", fontStyle: "italic", color: "gray" }}
            >
              status: <span style={{ color: "lightblue" }}>{}</span>
            </span>
          </p>
          <span>{output}</span>
        </div>
      </div>
    </>
  );
}

/**
 * @type {Object<string, React.CSSProperties>}
 */
const styles = {
  container: {
    width: "100%",
    height: "100%",
    position: "fixed",
    top: "0",
    left: "0",
    overflowY: "scroll",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
  },
  content: {
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
  },
  leftTopLabel: {
    position: "absolute",
    top: "9px",
    left: "9px",
    fontSize: "9px",
  },

  resposeTitle: {
    display: "flex",
    justifyContent: "space-between",
  },
};
