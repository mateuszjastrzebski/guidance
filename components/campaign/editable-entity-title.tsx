"use client";

import { Box, Text, Textarea } from "@mantine/core";
import { forwardRef, useState } from "react";

type EditableEntityTitleProps = {
  onBlur?: () => void;
  onChange: (value: string) => void;
  randomNames?: string[];
  value: string;
};

export const EditableEntityTitle = forwardRef<HTMLTextAreaElement, EditableEntityTitleProps>(
  function EditableEntityTitle({ onBlur, onChange, randomNames, value }, ref) {
    const [focused, setFocused] = useState(false);
    const showPlaceholder = !value && !focused;

    const handleRandomName = () => {
      if (!randomNames?.length) return;
      const pick = randomNames[Math.floor(Math.random() * randomNames.length)]!;
      onChange(pick);
    };

    return (
      <Box style={{ position: "relative" }}>
        <Textarea
          autosize
          maxRows={4}
          minRows={1}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChange={(e) => onChange(e.currentTarget.value)}
          onFocus={() => setFocused(true)}
          ref={ref}
          resize="none"
          size="lg"
          styles={{
            input: {
              background: "transparent",
              border: "none",
              boxShadow: "none",
              fontSize: "var(--mantine-h2-font-size, 1.5rem)",
              fontWeight: 700,
              lineHeight: 1.25,
              padding: 0
            },
            root: { width: "100%" }
          }}
          value={value}
          variant="unstyled"
        />
        {showPlaceholder && (
          <Box
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              fontSize: "var(--mantine-h2-font-size, 1.5rem)",
              fontWeight: 700,
              lineHeight: 1.25,
              userSelect: "none",
              whiteSpace: "nowrap"
            }}
          >
            <Text
              c="dimmed"
              component="span"
              style={{
                fontSize: "inherit",
                fontWeight: "inherit",
                lineHeight: "inherit",
                opacity: 0.5
              }}
            >
              Wpisz imię lub{" "}
            </Text>
            {randomNames?.length ? (
              <Text
                component="span"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleRandomName();
                }}
                style={{
                  fontSize: "inherit",
                  fontWeight: "inherit",
                  lineHeight: "inherit",
                  color: "var(--mantine-primary-color-filled)",
                  opacity: 0.7,
                  pointerEvents: "auto",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted"
                }}
              >
                losuj
              </Text>
            ) : (
              <Text
                c="dimmed"
                component="span"
                style={{ fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit", opacity: 0.5 }}
              >
                losuj
              </Text>
            )}
          </Box>
        )}
      </Box>
    );
  }
);
