import Head from "next/head";
import React, { useEffect, useState } from "react";
import { RSAClient } from "rsa-bridge";

const rsa = new RSAClient({ bits: 1024 });

export default function Home() {
  const statusOptions = ["disconnected", "connecting", "connected"];
  const [status, setStatus] = useState(0);
  const [resStatus, setResStatus] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  useEffect(() => {
    rsa.connect(`${window.location.origin}/api/publickey`);

    rsa.on("connecting", () => {
      setStatus(1);
    });

    rsa.on("connect", () => {
      setStatus(2);
    });
  }, []);

  function send() {
    rsa
      .fetch(`${window.location.origin}/api/hi`, {
        body: input,
        method: "POST",
      })
      .then(({ body, response }) => {
        console.info(">", response);
        setOutput(body);
        setResStatus(response.status);
      })
      .catch((err) => {
        console.warn(err);
        setResStatus(-1);
      });
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
              status:{" "}
              <span
                style={{
                  color: { 200: "green", 300: "orange" }[resStatus] || "red",
                }}
              >
                {resStatus}
              </span>
            </span>
          </p>
          <span
            style={{
              boxShadow: "0 0 3px 3px rgba(0,0,0,0.05)",
              padding: "5px",
              background: "rgba(167,167,255, 0.4)",
            }}
          >
            {output}
          </span>
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
