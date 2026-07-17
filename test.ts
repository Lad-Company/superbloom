type Block = { eyebrow?: string };
interface Props { body?: Block[] | null; }
function Test({ body = [] }: Props) {
  body.filter(b => b.eyebrow);
}
