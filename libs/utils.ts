import { uniqueNamesGenerator, Config, adjectives, starWars } from "unique-names-generator";

export function cls(...classnames: string[]) {
  return classnames.join(" ");
}

export const getRandomName = () => {
  const config: Config = {
    dictionaries: [adjectives, starWars],
    separator: "-",
    length: 2,
    style: "capital",
  };

  return uniqueNamesGenerator(config).replace(/\s/g, "-");
};
