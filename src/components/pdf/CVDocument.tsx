import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { pdfThemes, type PdfThemeName } from "@/lib/pdf-themes";

type CareerItem = {
  year?: string;
  role?: string;
  company?: string;
  desc?: string;
  stack?: string[];
};

export type CVPdfContent = {
  title: string;
  headline: string;
  locale: string;
  theme: PdfThemeName;
  sections: {
    experienceTitle: string;
  };
  careerHistory: CareerItem[];
};

export function CVDocument({ content }: { content: CVPdfContent }) {
  const colors = pdfThemes[content.theme] ?? pdfThemes["vscode-dark"];

  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: colors.bg,
      color: colors.text,
      padding: 30,
      fontFamily: "Courier",
      fontSize: 10,
      lineHeight: 1.45,
    },
    header: {
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
      paddingBottom: 10,
      marginBottom: 18,
    },
    title: {
      fontSize: 22,
      color: colors.accent,
      textTransform: "uppercase",
    },
    headline: {
      marginTop: 4,
      fontSize: 11,
      color: colors.muted,
    },
    meta: {
      marginTop: 10,
      fontSize: 8.5,
      color: colors.muted,
    },
    sectionTitle: {
      fontSize: 12,
      color: colors.accent2,
      marginTop: 14,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderStyle: "dashed",
    },
    job: {
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      paddingLeft: 10,
      marginBottom: 12,
    },
    jobHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    company: { color: colors.text, fontSize: 10, fontWeight: 700 },
    year: { color: colors.accent, fontSize: 10 },
    role: { color: colors.muted, fontSize: 9.5, marginBottom: 3 },
    desc: { color: colors.text, fontSize: 9.5 },
    stack: { color: colors.muted, fontSize: 8.5, marginTop: 4 },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 30,
      right: 30,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      textAlign: "center",
      fontSize: 8.5,
      color: colors.muted,
      letterSpacing: 0.8,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.headline}>{content.headline}</Text>
          <Text style={styles.meta}>
            ID: M_SOARES_V4.0 | LOC: Lisboa, PT | LANG: {content.locale.toUpperCase()} | THEME:{" "}
            {content.theme.toUpperCase()}
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>
            {"// "}
            {content.sections.experienceTitle}
          </Text>
          {content.careerHistory.map((item, index) => (
            <View key={`${item.company ?? "company"}_${item.year ?? "year"}_${index}`} style={styles.job}>
              <View style={styles.jobHeader}>
                <Text style={styles.company}>{item.company ?? ""}</Text>
                <Text style={styles.year}>{item.year ? `[${item.year}]` : ""}</Text>
              </View>
              {item.role ? <Text style={styles.role}>{item.role}</Text> : null}
              {item.desc ? <Text style={styles.desc}>{item.desc}</Text> : null}
              {item.stack?.length ? <Text style={styles.stack}>STACK: {item.stack.join(", ")}</Text> : null}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SYSTEM GENERATED REPORT | END OF FILE</Text>
        </View>
      </Page>
    </Document>
  );
}
