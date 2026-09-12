import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  facebookHref,
  hasProducerContact,
  instagramHref,
  linkedinHref,
  telegramHref,
  xHref,
  youtubeHref,
  type ProducerContact,
} from "@/lib/producers/contact";

type ProducerContactCardProps = {
  contact: ProducerContact;
  commission?: string | null;
  labels: {
    title: string;
    empty: string;
    ease: string;
    commission: string;
    notInformed: string;
    linkedin: string;
    youtube: string;
    facebook: string;
    x: string;
    company: string;
  };
};

const LINK_REL = "noopener noreferrer";

export function ProducerContactCard({
  contact,
  commission,
  labels,
}: ProducerContactCardProps) {
  const easeValue =
    contact.contactScore > 0 ? `${contact.contactScore}/100` : labels.notInformed;
  const commissionValue = commission?.trim() ? commission : labels.notInformed;

  return (
    <Card className="border-[#1E3A5F] bg-[#12263F]/80 text-[#F5F7FA]">
      <CardHeader>
        <CardTitle className="text-[#D4AF37]">{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {contact.companyName ? (
          <p className="text-[#F5F7FA]">
            {labels.company}: {contact.companyName}
          </p>
        ) : null}
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="block text-[#00C2CB] hover:underline"
          >
            ✉️ {contact.email}
          </a>
        ) : null}
        {contact.telegram ? (
          <a
            href={telegramHref(contact.telegram)}
            target="_blank"
            rel={LINK_REL}
            className="block text-[#00C2CB] hover:underline"
          >
            📧 @{contact.telegram}
          </a>
        ) : null}
        {contact.instagram ? (
          <a
            href={instagramHref(contact.instagram)}
            target="_blank"
            rel={LINK_REL}
            className="block text-[#00C2CB] hover:underline"
          >
            📷 @{contact.instagram}
          </a>
        ) : null}
        {contact.youtube ? (
          <a
            href={youtubeHref(contact.youtube)}
            target="_blank"
            rel={LINK_REL}
            className="block text-[#00C2CB] hover:underline"
          >
            ▶️ {labels.youtube}
          </a>
        ) : null}
        {contact.facebook ? (
          <a
            href={facebookHref(contact.facebook)}
            target="_blank"
            rel={LINK_REL}
            className="block text-[#00C2CB] hover:underline"
          >
            👤 {labels.facebook}
          </a>
        ) : null}
        {contact.linkedin ? (
          <a
            href={linkedinHref(contact.linkedin)}
            target="_blank"
            rel={LINK_REL}
            className="block text-[#00C2CB] hover:underline"
          >
            💼 {labels.linkedin}
          </a>
        ) : null}
        {contact.x ? (
          <a
            href={xHref(contact.x)}
            target="_blank"
            rel={LINK_REL}
            className="block text-[#00C2CB] hover:underline"
          >
            𝕏 @{contact.x}
          </a>
        ) : null}
        {!hasProducerContact(contact) ? (
          <p className="text-[#8BA3B8]">{labels.empty}</p>
        ) : null}
        <p className="pt-2 text-xs text-[#8BA3B8]">
          {labels.ease}: <span className="text-[#D4AF37]">{easeValue}</span>
        </p>
        <p className="text-xs text-[#8BA3B8]">
          {labels.commission}:{" "}
          <span className="text-[#D4AF37]">{commissionValue}</span>
        </p>
      </CardContent>
    </Card>
  );
}
